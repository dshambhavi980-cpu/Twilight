export type PreviewType = 'tictactoe' | 'connectfour' | 'cards' | 'chat' | 'truthdare' | 'trivia' | 'drawing';

export interface TutorialStep {
    id: number;
    title: string;
    description: string;
    previewType: PreviewType;
}

export interface GameTutorialConfig {
    gameId: string;
    title: string;
    description: string;
    steps: TutorialStep[];
}

// Map game routes/ids to their tutorials
export const tutorialRegistry: Record<string, GameTutorialConfig> = {
    // ────────────── CLASSIC GAMES ──────────────
    'tictactoe': {
        gameId: 'tictactoe',
        title: 'Tic Tac Toe',
        description: 'The classic game of X and O.',
        steps: [
            { id: 0, title: 'Your Goal', description: 'Get three of your symbols in a row (horizontal, vertical, or diagonal).', previewType: 'tictactoe' },
            { id: 1, title: 'Take Turns', description: 'Tap an empty square to place your symbol. You play as X or O.', previewType: 'tictactoe' },
            { id: 2, title: 'Watch Out', description: 'Block your partner from getting three in a row!', previewType: 'tictactoe' },
            { id: 3, title: 'Win!', description: 'The first to connect three wins the game.', previewType: 'tictactoe' },
        ]
    },
    'connect-four': {
        gameId: 'connect-four',
        title: 'Connect Four',
        description: 'Drop discs to connect four in a row.',
        steps: [
            { id: 0, title: 'Your Goal', description: 'Be the first to form a horizontal, vertical, or diagonal line of four of your own discs.', previewType: 'connectfour' },
            { id: 1, title: 'Drop Discs', description: 'Tap a column to drop your colored disc into the lowest available slot.', previewType: 'connectfour' },
            { id: 2, title: 'Block', description: 'Pay attention to where your partner drops their discs and block their lines!', previewType: 'connectfour' },
            { id: 3, title: 'Connect Four', description: 'Line up four discs to win the game.', previewType: 'connectfour' },
        ]
    },
    'dots-boxes': {
        gameId: 'dots-boxes',
        title: 'Dots & Boxes',
        description: 'Connect dots to claim squares.',
        steps: [
            { id: 0, title: 'Your Goal', description: 'Claim the most boxes by completing the fourth side of a square.', previewType: 'tictactoe' }, // Resusing grid preview for now
            { id: 1, title: 'Draw Lines', description: 'Take turns drawing a single horizontal or vertical line between two unjoined adjacent dots.', previewType: 'tictactoe' },
            { id: 2, title: 'Claim a Box', description: 'If your line completes a 1x1 box, it becomes yours and you get another turn!', previewType: 'tictactoe' },
            { id: 3, title: 'Win', description: 'The game ends when all boxes are claimed. The player with the most boxes wins.', previewType: 'tictactoe' },
        ]
    },
    'rps': {
        gameId: 'rps',
        title: 'Rock Paper Scissors',
        description: 'Best out of 5!',
        steps: [
            { id: 0, title: 'Make Your Choice', description: 'Quickly select Rock, Paper, or Scissors before the timer runs out.', previewType: 'truthdare' },
            { id: 1, title: 'The Rules', description: 'Rock crushes Scissors, Scissors cuts Paper, Paper covers Rock.', previewType: 'truthdare' },
            { id: 2, title: 'Best of 5', description: 'The first person to win 3 rounds wins the match!', previewType: 'truthdare' },
        ]
    },
    'hangman': {
        gameId: 'hangman',
        title: 'Hangman',
        description: 'Guess the word before it\'s too late.',
        steps: [
            { id: 0, title: 'The Setup', description: 'One player picks a secret word, the other tries to guess it.', previewType: 'drawing' },
            { id: 1, title: 'Guess Letters', description: 'Guess letters one by one. Correct letters fill in the blanks.', previewType: 'drawing' },
            { id: 2, title: 'Wrong Guesses', description: 'Every wrong guess adds a part to the hangman drawing.', previewType: 'drawing' },
            { id: 3, title: 'Win or Lose', description: 'Guess the word to survive, or let the drawing complete to lose!', previewType: 'drawing' },
        ]
    },

    // ────────────── COUPLE GAMES ──────────────
    'trivia': {
        gameId: 'trivia',
        title: 'Love Trivia',
        description: 'How well do you know your partner?',
        steps: [
            { id: 0, title: 'The Setup', description: 'You will both see the same question about your relationship or partner.', previewType: 'trivia' },
            { id: 1, title: 'Lock in Answers', description: 'Both of you must answer the question independently.', previewType: 'trivia' },
            { id: 2, title: 'The Reveal', description: 'Wait for the countdown to see both your answers side-by-side.', previewType: 'trivia' },
            { id: 3, title: 'Do you match?', description: 'Check if your answers are the same to earn points!', previewType: 'trivia' },
        ]
    },
    'wordle': {
        gameId: 'wordle',
        title: 'Word Guess',
        description: 'Guess the secret 5-letter word.',
        steps: [
            { id: 0, title: 'Your Goal', description: 'One partner picks a word, the other guesses it in 6 tries.', previewType: 'tictactoe' },
            { id: 1, title: 'Make Guesses', description: 'Enter 5-letter words to find the hidden one.', previewType: 'tictactoe' },
            { id: 2, title: 'Color Clues', description: 'Green: Right spot. Yellow: Right letter, wrong spot. Gray: Not in word.', previewType: 'tictactoe' },
            { id: 3, title: 'Win!', description: 'Guess the word correctly to score points for your team!', previewType: 'tictactoe' },
        ]
    },
    'truth-dare': {
        gameId: 'truth-dare',
        title: 'Truth or Dare',
        description: 'Spicy truths and fun dares!',
        steps: [
            { id: 0, title: 'Take Turns', description: 'Take turns choosing between answering a Truth question or doing a Dare.', previewType: 'truthdare' },
            { id: 1, title: 'Truth', description: 'If you choose Truth, you must answer the generated question honestly.', previewType: 'truthdare' },
            { id: 2, title: 'Dare', description: 'If you choose Dare, you must perform the generated challenge.', previewType: 'truthdare' },
            { id: 3, title: 'Have Fun!', description: 'Skip a question if it\'s too much, the goal is to have fun and connect!', previewType: 'truthdare' },
        ]
    },
    'would-you-rather': {
        gameId: 'would-you-rather',
        title: 'Would You Rather',
        description: 'Tough choices!',
        steps: [
            { id: 0, title: 'The Dilemma', description: 'You will be presented with two difficult or funny scenarios.', previewType: 'truthdare' },
            { id: 1, title: 'Make a Choice', description: 'Pick the option you would genuinely prefer.', previewType: 'truthdare' },
            { id: 2, title: 'Compare', description: 'See what your partner picked and discuss your hilarious choices!', previewType: 'truthdare' },
        ]
    },
    'this-or-that': {
        gameId: 'this-or-that',
        title: 'This or That',
        description: 'Quick choices, do you match?',
        steps: [
            { id: 0, title: 'Rapid Choices', description: 'You will see two opposing things (e.g., Coffee or Tea).', previewType: 'cards' },
            { id: 1, title: 'Pick One', description: 'Quickly select your preference.', previewType: 'cards' },
            { id: 2, title: 'Match?', description: 'See if your partner picked the same thing as you!', previewType: 'cards' },
        ]
    },

    // ────────────── BRAIN GAMES ──────────────
    '20-questions': {
        gameId: '20-questions',
        title: '20 Questions',
        description: 'Can you guess what they are thinking?',
        steps: [
            { id: 0, title: 'The Secret', description: 'One partner thinks of a person, place, or thing.', previewType: 'chat' },
            { id: 1, title: 'Ask Questions', description: 'The other partner asks Yes/No questions to narrow it down.', previewType: 'chat' },
            { id: 2, title: 'Answers', description: 'The thinker can only answer YES, NO, or SOMETIMES.', previewType: 'chat' },
            { id: 3, title: 'The Guess', description: 'Try to guess the secret before you run out of 20 questions!', previewType: 'chat' },
        ]
    },
    'emoji-charades': {
        gameId: 'emoji-charades',
        title: 'Emoji Charades',
        description: 'Describe it with emojis!',
        steps: [
            { id: 0, title: 'The Prompt', description: 'You will receive a movie, song, or phrase.', previewType: 'chat' },
            { id: 1, title: 'Emojis Only', description: 'Try to describe the prompt to your partner using ONLY emojis. No text allowed!', previewType: 'chat' },
            { id: 2, title: 'Guess', description: 'Your partner has to guess what the emojis mean.', previewType: 'chat' },
        ]
    },
    'memory': {
        gameId: 'memory',
        title: 'Memory Match',
        description: 'Find the matching pairs.',
        steps: [
            { id: 0, title: 'Flip Cards', description: 'Tap two cards to flip them over.', previewType: 'cards' },
            { id: 1, title: 'Make a Match', description: 'If the symbols on the cards match, they stay face up.', previewType: 'cards' },
            { id: 2, title: 'Remember', description: 'If they don\'t match, they flip back over. Remember where they are!', previewType: 'cards' },
            { id: 3, title: 'Win', description: 'Work together or compete to find all the matching pairs.', previewType: 'cards' },
        ]
    },
    'story-builder': {
        gameId: 'story-builder',
        title: 'Story Builder',
        description: 'Create a wild story together.',
        steps: [
            { id: 0, title: 'Start The Story', description: 'The game starts with a writing prompt.', previewType: 'chat' },
            { id: 1, title: 'Take Turns', description: 'Take turns adding exactly one sentence to the story.', previewType: 'chat' },
            { id: 2, title: 'Get Creative', description: 'Take the story in unexpected, funny, or romantic directions!', previewType: 'chat' },
        ]
    },
    'riddle-me': {
        gameId: 'riddle-me',
        title: 'Riddle Me',
        description: 'Solve the riddle before your partner.',
        steps: [
            { id: 0, title: 'The Riddle', description: 'A tricky brain teaser will appear on the screen.', previewType: 'trivia' },
            { id: 1, title: 'Race to Solve', description: 'Both of you try to figure out the answer as fast as possible.', previewType: 'trivia' },
            { id: 2, title: 'First Place', description: 'First one to enter the correct answer wins the round!', previewType: 'trivia' },
        ]
    },

    // ────────────── PARTY GAMES ──────────────
    'never-have-i-ever': {
        gameId: 'never-have-i-ever',
        title: 'Never Have I Ever',
        description: 'Confess your secrets!',
        steps: [
            { id: 0, title: 'The Statement', description: 'Read the "Never have I ever..." statement.', previewType: 'truthdare' },
            { id: 1, title: 'Confess', description: 'If you HAVE done the action, you must select "I Have".', previewType: 'truthdare' },
            { id: 2, title: 'Discuss', description: 'See what your partner has done and ask for the story behind it!', previewType: 'truthdare' },
        ]
    },
    'two-truths': {
        gameId: 'two-truths',
        title: 'Two Truths & A Lie',
        description: 'Can you spot the lie?',
        steps: [
            { id: 0, title: 'Setup', description: 'One partner writes down three statements about themselves: two true, one false.', previewType: 'chat' },
            { id: 1, title: 'Investigate', description: 'The other partner reads all three statements and tries to identify the false one.', previewType: 'chat' },
            { id: 2, title: 'Reveal', description: 'Lock in your guess and see if you caught the lie!', previewType: 'chat' },
        ]
    },
    'rapid-fire': {
        gameId: 'rapid-fire',
        title: 'Rapid Fire',
        description: 'Answer fast, don\'t overthink!',
        steps: [
            { id: 0, title: 'Quick Questions', description: 'You will be asked random questions in quick succession.', previewType: 'chat' },
            { id: 1, title: 'First Instinct', description: 'Type the very first thing that comes to your mind.', previewType: 'chat' },
            { id: 2, title: 'No Filtering', description: 'Don\'t overthink it, the fun is in the honest, raw answers!', previewType: 'chat' },
        ]
    },
    'song-lyrics': {
        gameId: 'song-lyrics',
        title: 'Finish The Lyrics',
        description: 'Do you know the words?',
        steps: [
            { id: 0, title: 'The Song', description: 'You will see a snippet of lyrics from a popular song.', previewType: 'chat' },
            { id: 1, title: 'Finish It', description: 'Type in the next line of the song.', previewType: 'chat' },
            { id: 2, title: 'No Cheating', description: 'Try not to look it up! See who knows their music better.', previewType: 'chat' },
        ]
    },
};
