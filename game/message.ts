export const message = {
  ITS_MY_BIRTHDAY: "Everyone pays {receiver} $2M",
  DEAL_BREAKER: "Player {playerToAct} gives {color} set to {receiver}",
  SLY_DEAL: "Player {playerToAct} gives {takeCard} to {receiver}",
  FORCED_DEAL:
    "Player {playerToAct} gives {takeCard} in exchange of {giveCard} to {receiver}",
  DEBT_COLLECTOR: "Player {playerToAct} gives $5M to {receiver}",
  SINGLE_PLAYER_RENT:
    "Player {playerToAct} pays ${amount}M to {receiver} as rent",
  ALL_PLAYER_RENT: "Everyone pays ${amount}M to {receiver} as rent",
};

export const sanitizeMessage = (
  message: string | undefined,
  params
): string | undefined => {
  for (const key in params) {
    const regex = new RegExp("\\{" + key + "\\}", "g");
    message = message?.replace(regex, params[key]);
  }
  return message;
};
