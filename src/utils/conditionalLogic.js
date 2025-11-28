function shouldShowQuestion(rules, answerProvided) {
  if (
    !rules ||
    !Array.isArray(rules.conditions) ||
    rules.conditions.length == 0
  ) {
    return true;
  }

  const checkCondition = (condition) => {
    const answer = answerProvided[condition.questionKey];

    if (answer == undefined || answer == null) {
      return false;
    }

    switch (condition.operator) {
      case "equals":
        return answer === condition.value;
      case "notEquals":
        return answer !== condition.value;
      case "contains":
        if (Array.isArray(answer)) {
          return answer.includes(condition.value);
        }

        if (typeof answer === "string") {
          return answer.includes(String(condition.value));
        }

        return false;
      default:
        return false;
    }
  };

  const result = rules.conditions.map(checkCondition);
  return rules.logic === "AND" ? result.every(Boolean) : result.some(Boolean);
}

module.exports = { shouldShowQuestion };
