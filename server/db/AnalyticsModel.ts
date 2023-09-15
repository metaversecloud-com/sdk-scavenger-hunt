import { Schema, model } from "mongoose";

const AnalyticsSchema = new Schema({
  totalCluesInWorld: Number,
  URLSlug: String,
  progressData: [{ studentId: String, userName: String, challengeDone: Boolean, cluesFound: [String] }],
});

export const AnalyticsModel = model("Analytics", AnalyticsSchema);
