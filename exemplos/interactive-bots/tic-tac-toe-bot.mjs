import { randomUUID } from "node:crypto";

import { isMain, startBot } from "./bot-kit.mjs";

const LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6],
];

export const winnerOf = (board) => {
  for (const [a, b, c] of LINES) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) return board[a];
  }
  return board.every(Boolean) ? "draw" : null;
};

export const gameMessage = (game) => {
  const result = winnerOf(game.board);
  const [x, o] = game.players;

  const status =
    result === "draw"
      ? "Deu velha! 🤝"
      : result
        ? `<@${result === "X" ? x : o}> venceu! 🎉`
        : `Vez de <@${game.turn === "X" ? x : o}> (${game.turn === "X" ? "❌" : "⭕"})`;

  return {
    content: `<@${x}> ❌ vs ⭕ <@${o}>\n${status}`,
    components: [0, 1, 2].map((row) => ({
      components: [0, 1, 2].map((column) => {
        const cell = row * 3 + column;
        const mark = game.board[cell];

        return {
          type: "button",
          style: mark === "X" ? "danger" : mark === "O" ? "primary" : "secondary",
          label: mark ?? "·",
          customId: `ttt:${game.id}:${cell}`,
          disabled: Boolean(mark) || Boolean(result),
        };
      }),
    })),
  };
};

export const play = (game, userId, cell) => {
  if (winnerOf(game.board)) return { error: "Esse jogo já acabou." };

  const expected = game.turn === "X" ? game.players[0] : game.players[1];
  if (!game.players.includes(userId)) return { error: "Você não está nesse jogo." };
  if (userId !== expected) return { error: "Não é sua vez." };
  if (game.board[cell]) return { error: "Essa casa já foi marcada." };

  const board = [...game.board];
  board[cell] = game.turn;

  return { game: { ...game, board, turn: game.turn === "X" ? "O" : "X" } };
};

export const newGame = (x, o) => ({ id: randomUUID().slice(0, 8), players: [x, o], board: Array(9).fill(null), turn: "X" });

if (isMain(import.meta.url)) {
  const games = new Map();
  const bot = startBot("tic-tac-toe-bot");

  bot.onReady(() =>
    bot.setCommands([
      {
        name: "tic-tac-toe",
        description: "Desafia alguém pro jogo da velha",
        options: [{ name: "opponent", description: "Quem vai jogar com você", kind: "usuario", required: true }],
      },
    ]),
  );

  bot.onCommand(async (command) => {
    if (command.command !== "tic-tac-toe") return;

    const opponent = String(command.options.opponent);
    if (opponent === command.user.id) return bot.replyPrivately(command, "Chame outra pessoa pra jogar.");

    const game = newGame(command.user.id, opponent);
    games.set(game.id, game);

    await bot.reply(command, gameMessage(game));
  });

  bot.onInteraction(async (interaction) => {
    if (interaction.type !== "component" || !interaction.customId.startsWith("ttt:")) return;

    const [, gameId, cell] = interaction.customId.split(":");
    const game = games.get(gameId);
    if (!game) return bot.replyPrivately(interaction, "Esse jogo não existe mais. Comece outro com /tic-tac-toe.");

    const result = play(game, interaction.user.id, Number(cell));
    if (result.error) return bot.replyPrivately(interaction, result.error);

    if (winnerOf(result.game.board)) games.delete(gameId);
    else games.set(gameId, result.game);

    await bot.update(interaction, gameMessage(result.game));
  });
}
