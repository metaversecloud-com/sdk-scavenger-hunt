export function getRandomPointInCircle(centerX, centerY, radius) {
  var angle = Math.random() * 2 * Math.PI;
  var randomRadius = Math.sqrt(Math.random()) * radius;
  var x = centerX + randomRadius * Math.cos(angle);
  var y = centerY + randomRadius * Math.sin(angle);

  return { x: x, y: y };
}
