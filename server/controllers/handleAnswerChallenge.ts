import { Request, Response } from "express";
import {
  awardBadge,
  errorHandler,
  getCredentials,
  getUserChallenge,
  getVisitorBadges,
  getVisitorProgress,
  getConfig,
  updateLeaderboard,
  Visitor,
} from "../utils/index.js";
import { WorldDataObjectType } from "../types.js";
import { addNewRowToGoogleSheets } from "../utils/addNewRowToGoogleSheets.js";

export const handleAnswerChallenge = async (req: Request, res: Response) => {
  try {
    const credentials = getCredentials(req.query);
    const { assetId, profileId, sceneDropId, urlSlug, visitorId } = credentials;

    const { answer, selectedAnswers } = req.body;

    const { dataObject } = await getConfig({ credentials });
    const { challenge, clues, theme } = dataObject as WorldDataObjectType;

    // Create visitor and fetch inventory/data for badge tracking
    const visitor = await Visitor.create(visitorId, urlSlug, { credentials });
    const visitorInventory = await getVisitorBadges(visitor);

    const userChallenge = await getUserChallenge(credentials);

    // Get current answer attempts and increment
    const visitorChallengeKey = `${urlSlug}_${sceneDropId}`;
    const currentAttempts = userChallenge?.answerAttempts || 0;
    const answerAttempts = currentAttempts + 1;

    const questionType = challenge.questionType || "text";
    let isCorrect = false;

    if (questionType === "text") {
      // Text answer comparison
      const submittedAnswer = answer?.toLowerCase()?.trim();
      isCorrect = challenge.answer?.trim()?.toLowerCase() === submittedAnswer;
    } else if (questionType === "multiple_choice" || questionType === "all_that_apply") {
      // Multiple choice or all that apply comparison
      const correctAnswers = challenge.correctAnswers || [];
      const submitted = selectedAnswers || [];

      if (correctAnswers.length === submitted.length) {
        isCorrect = correctAnswers.every((ans: string) => submitted.includes(ans));
      }
    }

    if (!isCorrect) {
      // Update answer attempts in visitor data object
      await visitor.updateDataObject({ [`${visitorChallengeKey}.answerAttempts`]: answerAttempts });
      return res.json({ isCorrect: false, answerAttempts, visitorInventory });
    }

    const analytics: { analyticName: string; uniqueKey?: string; profileId?: string; urlSlug?: string }[] = [
      { analyticName: `${theme}-completions`, uniqueKey: profileId, profileId, urlSlug },
      { analyticName: `completions`, uniqueKey: profileId, profileId, urlSlug },
    ];

    let text = "You completed the challenge!";
    const emote = challenge.selectedEmote ? { id: challenge.selectedEmote } : { name: `scavengerHunt-${theme}-1` };
    await visitor
      .grantExpression(emote)
      .then((response) => {
        if (response.success === true) {
          analytics.push({ analyticName: `${theme}-1-emoteUnlocked` });
          text = "You unlocked a new emote!";
        }
      })
      .catch((error) =>
        errorHandler({
          error,
          functionName: "handleAnswerChallenge",
          message: "Error granting emote",
        }),
      );

    await visitor.updateDataObject(
      { [`${visitorChallengeKey}.challengeDone`]: true, [`${visitorChallengeKey}.answerAttempts`]: answerAttempts },
      { analytics },
    );

    // Award badges based on achievements
    // Refresh visitor data object to get updated state after marking challenge done
    await visitor.fetchDataObject();
    const progress = getVisitorProgress(visitor.dataObject);

    let badgeAwarded = false;
    let updatedVisitorInventory = visitorInventory;

    // "Quick Thinker" - Answered correctly on first attempt
    if (answerAttempts === 1) {
      const result = await awardBadge({ credentials, visitor, visitorInventory, badgeName: "Quick Thinker" });
      if (result.awarded) badgeAwarded = true;
    }

    // "Curious Mind" - Completed 5 scavenger hunts
    if (progress.totalCompletions >= 10) {
      const result = await awardBadge({ credentials, visitor, visitorInventory, badgeName: "Curious Mind" });
      if (result.awarded) badgeAwarded = true;
    }

    // Re-fetch inventory if a badge was awarded
    if (badgeAwarded) {
      updatedVisitorInventory = await getVisitorBadges(visitor);
    }

    await Promise.all([
      visitor
        .fireToast({
          groupId: theme,
          title: "Congratulations",
          text,
        })
        .catch((error) =>
          errorHandler({
            error,
            functionName: "handleAnswerChallenge",
            message: "Error firing toast",
          }),
        ),
      visitor
        .triggerParticle({
          name: "explosion_float",
          duration: 6,
        })
        .catch((error) =>
          errorHandler({
            error,
            functionName: "handleAnswerChallenge",
            message: "Error triggering particle effects",
          }),
        ),
    ]);

    await updateLeaderboard({
      credentials,
      keyAssetId: assetId,
      cluesCount: Object.keys(clues).length,
      challengeDone: true,
      answerAttempts,
    });

    addNewRowToGoogleSheets({
      identityId: req?.query?.identityId,
      displayName: req?.query?.displayName,
      username: null,
      appName: "ScavengerHunt",
      event: `${theme}-completions`,
      urlSlug,
    });

    return res.json({ success: true, isCorrect: true, answerAttempts, visitorInventory: updatedVisitorInventory });
  } catch (error) {
    return errorHandler({
      error,
      functionName: "handleAnswerChallenge",
      message: "Error answering challenge.",
      req,
      res,
    });
  }
};
