import React from 'react';
import { Composition, Folder } from 'remotion';
import { TutorialVideo } from './TutorialVideo';
import { TicTacToeVideo } from './TicTacToeVideo';
import { ConnectFourVideo } from './ConnectFourVideo';
import { DotsBoxesVideo } from './DotsBoxesVideo';
import { RPSVideo } from './RPSVideo';
import { HangmanVideo } from './HangmanVideo';
import { TriviaVideo } from './TriviaVideo';
import { WordleVideo } from './WordleVideo';
import { TruthDareVideo } from './TruthDareVideo';
import { WouldYouRatherVideo } from './WouldYouRatherVideo';
import { ThisOrThatVideo } from './ThisOrThatVideo';
import { EmojiCharadesVideo } from './EmojiCharadesVideo';
import { TwentyQuestionsVideo } from './TwentyQuestionsVideo';
import { MemoryMatchVideo } from './MemoryMatchVideo';
import { StoryBuilderVideo } from './StoryBuilderVideo';
import { NeverHaveIEverVideo } from './NeverHaveIEverVideo';
import { TwoTruthsOneLieVideo } from './TwoTruthsOneLieVideo';
import { RapidFireVideo } from './RapidFireVideo';
import { SongLyricsVideo } from './SongLyricsVideo';
import { RiddleMeVideo } from './RiddleMeVideo';
import { tutorialRegistry } from '../../components/tutorials/tutorialData';

export const RemotionRoot: React.FC = () => {
	// Each step is exactly 4 seconds (120 frames at 30 fps)
	// We map over all 19 games and register a Composition for each
	
	const gameIds = Object.keys(tutorialRegistry);

	return (
		<>
			{gameIds.map((id) => {
				const config = tutorialRegistry[id];
				const durationInFrames = config.steps.length * 120; // 4 seconds per step
				
				let ComponentToRender = TutorialVideo;
				if (id === 'tictactoe') ComponentToRender = TicTacToeVideo as any;
				if (id === 'connect-four') ComponentToRender = ConnectFourVideo as any;
				if (id === 'dots-boxes') ComponentToRender = DotsBoxesVideo as any;
				if (id === 'rps') ComponentToRender = RPSVideo as any;
				if (id === 'hangman') ComponentToRender = HangmanVideo as any;
				if (id === 'trivia') ComponentToRender = TriviaVideo as any;
				if (id === 'wordle') ComponentToRender = WordleVideo as any;
				if (id === 'truth-dare') ComponentToRender = TruthDareVideo as any;
				if (id === 'would-you-rather') ComponentToRender = WouldYouRatherVideo as any;
				if (id === 'this-or-that') ComponentToRender = ThisOrThatVideo as any;
				if (id === 'emoji-charades') ComponentToRender = EmojiCharadesVideo as any;
				if (id === '20-questions') ComponentToRender = TwentyQuestionsVideo as any;
				if (id === 'memory') ComponentToRender = MemoryMatchVideo as any;
				if (id === 'story-builder') ComponentToRender = StoryBuilderVideo as any;
				if (id === 'never-have-i-ever') ComponentToRender = NeverHaveIEverVideo as any;
				if (id === 'two-truths') ComponentToRender = TwoTruthsOneLieVideo as any;
				if (id === 'rapid-fire') ComponentToRender = RapidFireVideo as any;
				if (id === 'song-lyrics') ComponentToRender = SongLyricsVideo as any;
				if (id === 'riddle-me') ComponentToRender = RiddleMeVideo as any;

				return (
					<Composition
						key={id}
						id={id}
						component={ComponentToRender}
						durationInFrames={durationInFrames}
						fps={30}
						width={720}
						height={1280}
						defaultProps={{
							config,
							primaryColor: id === 'connect-four' ? '#ef4444' : '#e11d48',
							isDark: true
						}}
					/>
				);
			})}
		</>
	);
};

