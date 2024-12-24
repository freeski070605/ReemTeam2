import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthService from './AuthService';
import PlayerHand from './PlayerHand';
import AiPlayer from './AiPlayerHand';
import Deck from './Deck';
import PlayerSpreads from './PlayerSpreads';
import PlayerInfo from './PlayerInfo';
import DiscardPile from './DiscardPile';
import GameInfo from './GameInfo';
import PlayerActions from './PlayerActions';
import GameEndOverlay from './GameEndOverlay';

import './GameBoard.css';
import axios from 'axios';
import { UserContext } from './UserContext';  // Import the UserContext
import Header from './Header';
import { io } from 'socket.io-client';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.min.js';

const stakesOptions = [1, 5, 10, 20, 50, 100];

const GameBoard = ({  tableId, 
    players, 
    setPlayers,
    stake, 
    setStake,
    playerChips, 
    setPlayerChips  }) => {
    const navigate = useNavigate();
    const [stakeWon, setStakeWon] = useState(null);
    const [stakeSet, setStakeSet] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [playerHands, setPlayerHands] = useState(players.map(() => []));
    const [deck, setDeck] = useState([]);
    const [discardPile, setDiscardPile] = useState([]);
    const [currentTurn, setCurrentTurn] = useState(0);
    const [hasDrawnCard, setHasDrawnCard] = useState(false);
    const [gameOver, setGameOver] = useState(false);
    const [winner, setWinner] = useState(null);
    const [playerSpreads, setPlayerSpreads] = useState(players.map(() => []));
    const [hasValidSpread, setHasValidSpread] = useState(false);
    const [hasValidHit, setHasValidHit] = useState(false);
    const [gameStarted, setGameStarted] = useState(false);
    const [winningPoints, setWinningPoints] = useState(null);
    const [gameId, setGameId] = useState(null);
    const [username, setUsername] = useState(null);
    const [pot, setPot] = useState(0);
    const [socket, setSocket] = useState(null);
    const [aiPlayer, setAiPlayer] = useState(new AiPlayer('AI Player'));
    const { user, updateUserChips } = useContext(UserContext);  // Use the UserContext
    const [gameEndMessage, setGameEndMessage] = useState('');
    const [hitCounter, setHitCounter] = useState(players.map(() => 0));
    const [forceRender, setForceRender] = useState(0);
    const [renderKey, setRenderKey] = useState(0);
    const [aiProcessing, setAiProcessing] = useState(false);
    const [drawnCard, setDrawnCard] = useState(null);
    const [drawnDiscardCard, setDrawnDiscardCard] = useState(null);
    let aiTurnInProgress = false; // Add an AI turn lock outside the component
    let turnLock = false; // Prevent redundant turn calls





    useEffect(() => {
        console.log('Stake received in GameBoard:', stake); // This log helps confirm the stake is set
    }, [stake]);

    const initialDeck = [
        { rank: '2', suit: 'Hearts' }, { rank: '2', suit: 'Diamonds' },
        { rank: '2', suit: 'Clubs' }, { rank: '2', suit: 'Spades' },
        { rank: '3', suit: 'Hearts' }, { rank: '3', suit: 'Diamonds' },
        { rank: '3', suit: 'Clubs' }, { rank: '3', suit: 'Spades' },
        { rank: '4', suit: 'Hearts' }, { rank: '4', suit: 'Diamonds' },
        { rank: '4', suit: 'Clubs' }, { rank: '4', suit: 'Spades' },
        { rank: '5', suit: 'Hearts' }, { rank: '5', suit: 'Diamonds' },
        { rank: '5', suit: 'Clubs' }, { rank: '5', suit: 'Spades' },
        { rank: '6', suit: 'Hearts' }, { rank: '6', suit: 'Diamonds' },
        { rank: '6', suit: 'Clubs' }, { rank: '6', suit: 'Spades' },
        { rank: '7', suit: 'Hearts' }, { rank: '7', suit: 'Diamonds' },
        { rank: '7', suit: 'Clubs' }, { rank: '7', suit: 'Spades' },
        { rank: 'J', suit: 'Hearts' }, { rank: 'J', suit: 'Diamonds' },
        { rank: 'J', suit: 'Clubs' }, { rank: 'J', suit: 'Spades' },
        { rank: 'Q', suit: 'Hearts' }, { rank: 'Q', suit: 'Diamonds' },
        { rank: 'Q', suit: 'Clubs' }, { rank: 'Q', suit: 'Spades' },
        { rank: 'K', suit: 'Hearts' }, { rank: 'K', suit: 'Diamonds' },
        { rank: 'K', suit: 'Clubs' }, { rank: 'K', suit: 'Spades' },
        { rank: 'ace', suit: 'Hearts' }, { rank: 'ace', suit: 'Diamonds' },
        { rank: 'ace', suit: 'Clubs' }, { rank: 'ace', suit: 'Spades' }
    ];

    useEffect(() => {
        if (user && !gameStarted) {
            initializeGame();
        }
    }, [user, gameStarted]);

    useEffect(() => {
        let isActive = true;
        
        if (players[currentTurn]?.username === "AI Player" && isActive) {
            const timer = setTimeout(() => {
                handleAiMove();
            }, 1000);
            
            return () => {
                isActive = false;
                clearTimeout(timer);
            };
        }
    }, [currentTurn]);
    

    useEffect(() => {
        console.log("Game State Updated:", {
            currentTurn,
            turnLock,
            aiTurnInProgress,
            playerHands,
            discardPile,
            deck,
        });
    }, [currentTurn, turnLock, aiTurnInProgress, playerHands, discardPile, deck]);

    useEffect(() => {
        console.log("Force render triggered:", forceRender);
    }, [forceRender]);
    
    useEffect(() => {
        const gameState = {
          players,
          stake,
          playerHands,
          deck,
          discardPile,
          currentTurn,
          hasDrawnCard,
          playerSpreads,
          pot,
          gameStarted,
          gameOver,
          hitCounter,
          stakeWon,
          winner,
          gameEndMessage
        };
        localStorage.setItem(`gameState-${tableId}`, JSON.stringify(gameState));
      }, [players, stake, playerHands, deck, discardPile, currentTurn, hasDrawnCard, playerSpreads, pot, gameStarted, gameOver, hitCounter, stakeWon, winner, gameEndMessage]);
      
      useEffect(() => {
        const savedState = localStorage.getItem(`gameState-${tableId}`);
        if (savedState) {
          const parsedState = JSON.parse(savedState);
          // Restore all game state
          setPlayers(parsedState.players);
          setStake(parsedState.stake);
          setPlayerHands(parsedState.playerHands);
          setDeck(parsedState.deck);
          setDiscardPile(parsedState.discardPile);
          setCurrentTurn(parsedState.currentTurn);
          setHasDrawnCard(parsedState.hasDrawnCard);
          setPlayerSpreads(parsedState.playerSpreads);
          setPot(parsedState.pot);
          setGameStarted(parsedState.gameStarted);
          setGameOver(parsedState.gameOver);
          setHitCounter(parsedState.hitCounter);
          setStakeWon(parsedState.stakeWon);
          setWinner(parsedState.winner);
          setGameEndMessage(parsedState.gameEndMessage);
        }
      }, []);
      
      
      useEffect(() => {
        return () => {
          // Only remove state if game is complete
          if (gameOver) {
            localStorage.removeItem(`gameState-${tableId}`);
          }
        };
      }, [gameOver, tableId]);
      
    
    
    const initializeGame = async () => {
        if (!gameStarted) {
            const shuffledDeck = shuffleDeck([...initialDeck]);
            const dealtHands = dealHands(shuffledDeck, players.length);
            setDeck(shuffledDeck);
            setPlayerHands(dealtHands);
    
            let newPot = 0;
    
            // Deduct the stake from all players and add to the pot
            players.forEach(async (player) => {
                const chipsChange = -stake;
                newPot += stake;
                await updatePlayerChips(player.username, chipsChange);
            });
    
            setPot(newPot);  // Update the pot state with the total stake
            setGameStarted(true);
        }
    };
    
    
    

    

 

    useEffect(() => {
        checkForValidSpread();
    }, [playerHands, currentTurn]);

     


    const handleAiMove = async () => {
        if (aiProcessing || turnLock) {
            console.log("AI move already in progress or turn locked. Skipping...");
            return;
        }
    
        setAiProcessing(true);
    
        try {
            console.log("AI Move Started...");
            const currentHand = [...playerHands[currentTurn]];
    
            // Draw phase
            if (!hasDrawnCard) {
                if (deck.length > 0 && isBeneficialCard(deck[deck.length - 1], currentHand)) {
                    await drawCard(); 
                } else {
                    await drawFromDiscardPile();
                }
                await new Promise(resolve => setTimeout(resolve, 500));
            }
    
            // Strategy phase - Check for spreads first
            if (isValidSpread(playerHands[currentTurn])) {
                console.log("AI executes spread");
                await new Promise(resolve => {
                    handleSpread();
                    setTimeout(resolve, 500);
                });
                
                // Add discard after spread
                const updatedHandAfterSpread = [...playerHands[currentTurn]];
                const cardToDiscardIndex = findLeastValuableCard(updatedHandAfterSpread);
                
                if (cardToDiscardIndex !== -1) {
                    await new Promise(resolve => {
                        discardCard(cardToDiscardIndex, () => {
                            console.log("AI discard after spread completed");
                            resolve();
                        });
                    });
                }
                return;
            }
    
            // Rest of the AI logic remains the same...
            const validHit = findValidHitForAi(playerHands[currentTurn]);
            if (validHit) {
                console.log("AI executes hit");
                await new Promise(resolve => {
                    handleHit(validHit.cardIndex, validHit.targetPlayerIndex, validHit.spreadIndex);
                    setTimeout(resolve, 500);
                });
                  // Add discard after spread
                  const updatedHandAfterHit = [...playerHands[currentTurn]];
                  const cardToDiscardIndex = findLeastValuableCard(updatedHandAfterHit);
                  
                  if (cardToDiscardIndex !== -1) {
                      await new Promise(resolve => {
                          discardCard(cardToDiscardIndex, () => {
                              console.log("AI discard after hit completed");
                              resolve();
                          });
                      });
                  }
                  return;
            }
    
            if (shouldAiDrop(playerHands[currentTurn])) {
                console.log("AI executes drop");
                handleDrop(true);
                return;
            }
    
            // Regular discard if no other moves were made
            const updatedHand = [...playerHands[currentTurn]];
            const cardToDiscardIndex = findLeastValuableCard(updatedHand);
            
            if (cardToDiscardIndex !== -1) {
                await new Promise(resolve => {
                    discardCard(cardToDiscardIndex, () => {
                        console.log("AI discard completed");
                        resolve();
                    });
                });
            }
    
        } finally {
            setAiProcessing(false);
            setForceRender(prev => prev + 1);
        }
    };
    
    
    
    const AiDrawCard = () => {
        if (hasDrawnCard) {
            console.warn("AI has already drawn a card this turn.");
            return;
        }
    
        // Prioritize drawing from the discard pile if it's beneficial
        if (discardPile.length > 0 && isBeneficialCard(discardPile[discardPile.length - 1], playerHands[currentTurn])) {
            console.log("AI draws from the discard pile.");
            drawFromDiscardPile(() => {
                console.log("AI successfully drew a card from the discard pile.");
                setHasDrawnCard(true); // Mark that the AI has drawn a card
            });
            return;
        }
    
        // If not beneficial, draw from the deck
        if (deck.length > 0) {
            console.log("AI draws from the deck.");
            drawCard(() => {
                console.log("AI successfully drew a card from the deck.");
                setHasDrawnCard(true); // Mark that the AI has drawn a card
            });
        } else {
            console.error("Deck is empty. AI cannot draw a card.");
        }
    };
    
    
    
    
    const handleAiDiscard = () => {
        const cardToDiscardIndex = findLeastValuableCard(playerHands[currentTurn]);
        console.log(`AI discards card at index ${cardToDiscardIndex}.`);
        discardCard(cardToDiscardIndex, () => {
            finalizeAiTurn();
        });
    };
    
    const finalizeAiTurn = () => {
        console.log("AI ends its turn.");
        aiTurnInProgress = false;
    
        setTimeout(() => {
            nextTurn(); // Proceed to the next player's turn
        }, 300); // Add a slight delay for smoother transitions
    };
    
    
    
   
    
    const findValidHitForAi = (hand) => {
        for (let cardIndex = 0; cardIndex < hand.length; cardIndex++) {
            for (let targetPlayerIndex = 0; targetPlayerIndex < playerSpreads.length; targetPlayerIndex++) {
                for (let spreadIndex = 0; spreadIndex < playerSpreads[targetPlayerIndex].length; spreadIndex++) {
                    if (isValidHit(hand[cardIndex], playerSpreads[targetPlayerIndex][spreadIndex])) {
                        return { cardIndex, targetPlayerIndex, spreadIndex };
                    }
                }
            }
        }
        return null;
    };

    const isBeneficialCard = (card, hand) => {
        const rankFrequency = hand.filter((c) => c.rank === card.rank).length;
        return rankFrequency >= 2; // Helps form a set
    };
    

    const findLeastValuableCard = (hand) => {
        const pointValues = { ace: 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, J: 10, Q: 10, K: 10 };
    
        // Prioritize cards that don't contribute to spreads or hits
        let discardIndex = -1;
        let minValue = Infinity;
    
        hand.forEach((card, index) => {
            const isPartOfPotentialSpread = hand.filter(
                (c) => c.rank === card.rank || c.suit === card.suit
            ).length >= 2;
    
            if (!isPartOfPotentialSpread && pointValues[card.rank] < minValue) {
                minValue = pointValues[card.rank];
                discardIndex = index;
            }
        });
    
        // If all cards contribute, pick the card with the lowest point value
        if (discardIndex === -1) {
            hand.forEach((card, index) => {
                if (pointValues[card.rank] < minValue) {
                    minValue = pointValues[card.rank];
                    discardIndex = index;
                }
            });
        }
    
        return discardIndex;
    };
    

    const shouldAiDrop = (hand) => {
        const points = calculatePoints(hand);
        return points <= 10; // Drop if total points are low (e.g., 10 or less)
    };
    
    
    
    
    

    const shuffleDeck = (deck) => {
        for (let i = deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [deck[i], deck[j]] = [deck[j], deck[i]];
        }
        return deck;
    };

    const dealHands = (shuffledDeck, playerCount) => {
        const hands = Array.from({ length: playerCount }, () => []);
        for (let i = 0; i < 5; i++) {
            for (let j = 0; j < playerCount; j++) {
                if (shuffledDeck.length > 0) {
                    hands[j].push(shuffledDeck.pop());
                }
            }
        }
        return hands;
    };

    const drawCard = () => {
        if (!gameOver && !hasDrawnCard) {
            setDrawnDiscardCard(null); // Reset tracked card when drawing from deck

            const updatedPlayerHands = [...playerHands];
            const updatedDeck = [...deck];
            if (updatedDeck.length > 0) {
                updatedPlayerHands[currentTurn].push(updatedDeck.pop());
                setPlayerHands(updatedPlayerHands);
                setDeck(updatedDeck);
                setHasDrawnCard(true);
            } else {
                handleGameEnd();
            }
        }
    };

    const drawFromDiscardPile = () => {
        if (!gameOver && !hasDrawnCard && discardPile.length > 0) {
            const updatedPlayerHands = [...playerHands];
            const updatedDiscardPile = [...discardPile];
            const drawnCard = updatedDiscardPile.pop();
            
            // Track the drawn card
            setDrawnDiscardCard(drawnCard);
            
            updatedPlayerHands[currentTurn].push(drawnCard);
            setPlayerHands(updatedPlayerHands);
            setDiscardPile(updatedDiscardPile);
            setHasDrawnCard(true);
        }
    };
    
    const discardCard = (cardIndex, callback) => {
        const cardToDiscard = playerHands[currentTurn][cardIndex];
        
        // Check if trying to discard the same card that was drawn
        if (drawnDiscardCard && 
            cardToDiscard.rank === drawnDiscardCard.rank && 
            cardToDiscard.suit === drawnDiscardCard.suit) {
            console.log("Cannot discard the same card drawn from discard pile");
            return;
        }
    
        setPlayerHands(prevHands => {
            const newHands = [...prevHands];
            if (cardToDiscard) {
                newHands[currentTurn] = newHands[currentTurn].filter((_, index) => index !== cardIndex);
                setDiscardPile(prev => [...prev, cardToDiscard]);
                setHasDrawnCard(false);
                setDrawnDiscardCard(null); // Reset tracked card
                
                if (callback) callback();
                
                setTimeout(() => {
                    nextTurn();
                }, 300);
            }
            return newHands;
        });
    };
    
    
    
    
    


    const nextTurn = () => {
        console.log("Switching turns...");
        if (turnLock) {
            console.warn("Turn is locked. Exiting.");
            return;
        }
         // Reduce hit counters at the end of each round
    const updatedHitCounter = [...hitCounter];
    updatedHitCounter.forEach((count, index) => {
        if (count > 0) updatedHitCounter[index]--;
    });
    setHitCounter(updatedHitCounter);
    
        turnLock = true;
        setHasDrawnCard(false);
    
        setCurrentTurn((prevTurn) => {
            const nextTurnIndex = (prevTurn + 1) % players.length;
            console.log(`Next Turn: ${players[nextTurnIndex].username}`);
            return nextTurnIndex;
        });
    
        setTimeout(() => {
            turnLock = false;
            console.log("Turn lock released.");
            setForceRender((prev) => prev + 1); // Trigger a re-render explicitly
        }, 500); // Allow state updates to propagate
    };
    

    

    // const checkForWinner = (hands) => {
    //     hands.forEach((hand, index) => {
    //         if (hand.length === 0) {
    //             setGameOver(true);
    //             setWinner(players[index]);
    //             handleChipsUpdate(players[index].username, stake);
    //         }
    //     });
    // };

    const handleDiscardPileClick = () => {
        // Only allow drawing if it's player's turn and they haven't drawn yet
        if (currentTurn === 0 && !hasDrawnCard && discardPile.length > 0) {
            drawFromDiscardPile();
        } else {
            console.log("Cannot draw from discard pile:", 
                currentTurn !== 0 ? "Not your turn" : 
                hasDrawnCard ? "Already drew a card" : 
                "Discard pile is empty");
        }
    };
    const checkForValidSpread = () => {
        const currentPlayerHand = playerHands[currentTurn];
        const isValid = isValidSpread(currentPlayerHand);
        setHasValidSpread(isValid);
    };

    const isValidSpread = (hand) => {
        const cardCount = {};
        const suitRuns = {};

        hand.forEach((card) => {
            cardCount[card.rank] = (cardCount[card.rank] || 0) + 1;
            if (!suitRuns[card.suit]) {
                suitRuns[card.suit] = [];
            }
            suitRuns[card.suit].push(card);
        });

        const hasThreeOfAKind = Object.values(cardCount).some((count) => count >= 3);

        const hasSuitRun = Object.keys(suitRuns).some((suit) => {
            const sortedCards = suitRuns[suit].sort((a, b) => {
                return ['ace', '2', '3', '4', '5', '6', '7', 'J', 'Q', 'K'].indexOf(a.rank) - ['ace', '2', '3', '4', '5', '6', '7', 'J', 'Q', 'K'].indexOf(b.rank);
            });
            for (let i = 0; i < sortedCards.length - 2; i++) {
                const run = sortedCards.slice(i, i + 3);
                if (run.length === 3 &&
                    ['ace', '2', '3', '4', '5', '6', '7', 'J', 'Q', 'K'].indexOf(run[0].rank) + 1 === ['ace', '2', '3', '4', '5', '6', '7', 'J', 'Q', 'K'].indexOf(run[1].rank) &&
                    ['ace', '2', '3', '4', '5', '6', '7', 'J', 'Q', 'K'].indexOf(run[1].rank) + 1 === ['ace', '2', '3', '4', '5', '6', '7', 'J', 'Q', 'K'].indexOf(run[2].rank)) {
                    return true;
                }
            }
            return false;
        });

        return hasThreeOfAKind || hasSuitRun;
    };

    const handleSpread = () => {
        if (!playerHands[currentTurn]) {
            console.error(`No hand found for player at index ${currentTurn}`);
            return;
        }
    
        let currentPlayerHand = [...playerHands[currentTurn]];
    
        if (isValidSpread(currentPlayerHand)) {
            const updatedPlayers = [...players];
            const updatedPlayerSpreads = [...playerSpreads];
    
            if (!Array.isArray(updatedPlayerSpreads[currentTurn])) {
                updatedPlayerSpreads[currentTurn] = [];
            }
    
            const currentPlayer = updatedPlayers[currentTurn];
            let spread = [];
    
            // Find and create spreads of three or more cards of the same rank
            for (let i = currentPlayerHand.length - 1; i >= 0; i--) {
                const card = currentPlayerHand[i];
                if (card) {
                    const cardCount = currentPlayerHand.filter((c) => c && c.rank === card.rank).length;
                    if (cardCount >= 3 && !spread.find((c) => c.rank === card.rank)) {
                        spread.push(...currentPlayerHand.filter((c) => c.rank === card.rank));
                        currentPlayerHand = currentPlayerHand.filter((c) => c.rank !== card.rank);
                    }
                }
            }
    
            // Find and create suit runs of three or more consecutive cards
            const suitRuns = {};
            currentPlayerHand.forEach((card) => {
                if (card) {
                    if (!suitRuns[card.suit]) {
                        suitRuns[card.suit] = [];
                    }
                    suitRuns[card.suit].push(card);
                }
            });
    
            Object.keys(suitRuns).forEach((suit) => {
                const sortedCards = suitRuns[suit].sort((a, b) => {
                    return ['ace', '2', '3', '4', '5', '6', '7', 'J', 'Q', 'K'].indexOf(a.rank) - ['ace', '2', '3', '4', '5', '6', '7', 'J', 'Q', 'K'].indexOf(b.rank);
                });
                for (let i = 0; i < sortedCards.length - 2; i++) {
                    const run = sortedCards.slice(i, i + 3);
                    if (run.length === 3 &&
                        ['ace', '2', '3', '4', '5', '6', '7', 'J', 'Q', 'K'].indexOf(run[0].rank) + 1 === ['ace', '2', '3', '4', '5', '6', '7', 'J', 'Q', 'K'].indexOf(run[1].rank) &&
                        ['ace', '2', '3', '4', '5', '6', '7', 'J', 'Q', 'K'].indexOf(run[1].rank) + 1 === ['ace', '2', '3', '4', '5', '6', '7', 'J', 'Q', 'K'].indexOf(run[2].rank)) {
                        spread = run;
                        run.forEach(card => {
                            const index = currentPlayerHand.findIndex(c => c.rank === card.rank && c.suit === card.suit);
                            if (index > -1) {
                                currentPlayerHand.splice(index, 1);
                            }
                        });
                        break;
                    }
                }
            });
    
            updatedPlayerSpreads[currentTurn].push(spread);
            setPlayerSpreads(updatedPlayerSpreads);
            setPlayerHands(prevPlayerHands => {
                const newPlayerHands = [...prevPlayerHands];
                newPlayerHands[currentTurn] = currentPlayerHand;
                return newPlayerHands;
            });
    
            // Check if the current player has two spreads
            if (updatedPlayerSpreads[currentTurn].length === 2) {
                const totalStakeWon = stake * 2 * (players.length - 1);
                console.log(`Game over! Player ${currentPlayer.username} wins ${totalStakeWon} chips with 2 successful spreads.`);
            
                // Set the game-end message
                setGameEndMessage(`REEM TEAM!!! Congrats ${players[currentTurn].username}! You won ${totalStakeWon}`);
            
                // Use handleGameEnd to correctly update the chips and end the game
                 handleGameEnd(currentPlayer, totalStakeWon);
            
                setStakeWon(totalStakeWon);
            } else {
                setHasValidSpread(false);
                setHasDrawnCard(true); // Proceed to the next player's turn if there are no valid spreads
            }
    
        } else {
            console.log("No valid spread found in the player's hand.");
        }
    };
    
    

    const hasTwoSpreads = (spreads) => {
        return spreads.length > 1 && spreads.every(spread => spread.length > 0);
    };

    const handleGameEnd = async (winner, totalStakeWon) => {
        if (!winner || !winner.username) {
            console.error('Invalid winner, cannot update chips.');
            return;
        }
    
        let winMethod = '';
        if (playerSpreads[currentTurn].length === 2) {
            winMethod = 'by making two spreads';
        } else if (playerHands[currentTurn].length === 0) {
            winMethod = 'by discarding all cards';
        } else {
            winMethod = 'with the lowest points';
        }
    
        setGameEndMessage(`🏆 ${winner.username} wins ${totalStakeWon} chips ${winMethod}! 🎉`);
    
        if (winner.username === 'AI Player') {
            console.log(`AI Player wins ${totalStakeWon} chips ${winMethod}`);
        } else {
            try {
                await updatePlayerChips(winner.username, totalStakeWon);
            } catch (error) {
                console.error('Error updating chips:', error);
            }
        }
    
        setGameOver(true);
    };
    
    
    
    
    

    const calculatePoints = (hand) => {
        const pointValues = { 'ace': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, 'J': 10, 'Q': 10, 'K': 10 };
        return hand.reduce((sum, card) => sum + pointValues[card.rank], 0);
    };

    const handleDrop = (isDrop = true) => {
        if (hitCounter[currentTurn] > 0) {
            const roundsLeft = hitCounter[currentTurn];

            alert(`Cannot drop! You must wait ${roundsLeft} more round${roundsLeft > 1 ? 's' : ''} because you were hit.`);
            console.log("Cannot drop! Player was hit and must wait.");
            return;
        }
    
        // Existing drop logic
        const points = playerHands.map(hand => calculatePoints(hand));
        const lowestPoints = Math.min(...points);
        const currentPlayerIndex = currentTurn;
        const currentPlayerPoints = points[currentPlayerIndex];
    
        const winnerIndices = points.reduce((acc, point, index) => {
            if (point === lowestPoints) {
                acc.push(index);
            }
            return acc;
        }, []);
    
        const winnerIndex = winnerIndices.length === 1
            ? winnerIndices[0]
            : winnerIndices[Math.floor(Math.random() * winnerIndices.length)];
        const winner = players[winnerIndex];
    
        let stakeMultiplier = 1;
    
        if (isDrop) {
            if (currentPlayerPoints === lowestPoints && currentPlayerIndex === winnerIndex) {
                stakeMultiplier = 1;
            } else {
                stakeMultiplier = 2;
            }
        } else {
            stakeMultiplier = 2;
        }
    
        const totalStakeWon = stake * stakeMultiplier;
        setGameEndMessage(
            `🃏 ${winner.username} wins ${totalStakeWon} chips by dropping with ${lowestPoints} points! 
            \n${players.map((p, i) => `${p.username}: ${points[i]} points`).join('\n')}`
        );
    
        handleGameEnd(winner, totalStakeWon);
        setWinner(winner.username);
        setWinningPoints(lowestPoints);
        localStorage.removeItem(`gameState-${tableId}`);

    };
    
    
    
    
    
    
    
    
    
    
    
    

    const isValidHit = (card, spread) => {
        const ranks = ['ace', '2', '3', '4', '5', '6', '7', 'J', 'Q', 'K'];
    
        if (spread.every(c => c.rank === card.rank)) {
            return true; // Valid set hit
        }
    
        if (spread.every(c => c.suit === card.suit)) {
            const sortedRanks = spread.map(c => ranks.indexOf(c.rank)).sort((a, b) => a - b);
            const cardRank = ranks.indexOf(card.rank);
            return cardRank === sortedRanks[0] - 1 || cardRank === sortedRanks[sortedRanks.length - 1] + 1;
        }
        return false;
    };
    

    const CheckForValidHit = () => {
        const currentPlayerHand = playerHands[currentTurn];
        if (!currentPlayerHand || !Array.isArray(currentPlayerHand)) {
            return false;
        }
        for (const card of currentPlayerHand) {
            for (let i = 0; i < playerSpreads.length; i++) {
                for (let j = 0; j < playerSpreads[i].length; j++) {
                    if (isValidHit(card, playerSpreads[i][j])) {
                        return true;
                    }
                }
            }
        }
        return false;
    };

    const countSpreads = (playerIndex) => {
        if (playerSpreads[playerIndex] !== undefined) {
            return playerSpreads[playerIndex].length;
        } else {
            return 0;
        }
    };

    const handleHit = (cardIndex, targetPlayerIndex, targetSpreadIndex) => {
        const updatedPlayerHands = [...playerHands];
        const card = updatedPlayerHands[currentTurn][cardIndex];
    
        if (isValidHit(card, playerSpreads[targetPlayerIndex][targetSpreadIndex])) {
            const updatedSpreads = [...playerSpreads];
            updatedSpreads[targetPlayerIndex][targetSpreadIndex].push(card);
    
            // Remove the card from the current player's hand
            updatedPlayerHands[currentTurn].splice(cardIndex, 1);
    
            // Update hit counter for the target player
            const updatedHitCounter = [...hitCounter];
            updatedHitCounter[targetPlayerIndex]++;
    
            setPlayerHands(updatedPlayerHands);
            setPlayerSpreads(updatedSpreads);
            setHitCounter(updatedHitCounter);
    
            console.log(
                `Player ${targetPlayerIndex} hit! Drop blocked for ${updatedHitCounter[targetPlayerIndex]} turn(s).`
            );
    
            // Proceed to the next turn
            setHasDrawnCard(true); // Allow the current player to take another action();
        } else {
            console.log("No valid hit found.");
        }
    };

    const findValidHit = () => {
        const currentPlayerHand = playerHands[currentTurn];
    
        for (let cardIndex = 0; cardIndex < currentPlayerHand.length; cardIndex++) {
            const card = currentPlayerHand[cardIndex];
            for (let targetPlayerIndex = 0; targetPlayerIndex < playerSpreads.length; targetPlayerIndex++) {
                for (let spreadIndex = 0; spreadIndex < playerSpreads[targetPlayerIndex].length; spreadIndex++) {
                    if (isValidHit(card, playerSpreads[targetPlayerIndex][spreadIndex])) {
                        return { cardIndex, targetPlayerIndex, spreadIndex }; // Return the first valid hit
                    }
                }
            }
        }
        return null; // No valid hit found
    };
    
    
    
    

    const handleNewGame = () => {
        setGameStarted(false);
        setGameOver(false);
        setPlayerHands(players.map(() => []));
        setPlayerSpreads(players.map(() => []));
        setDeck(initialDeck);
        setDiscardPile([]);
        setCurrentTurn(0);
        setHasDrawnCard(false);
        initializeGame();
        setGameEndMessage(''); // Reset the game-end message
    };
    const getChipsByUsername = async (username) => {
        try {
            const token = localStorage.getItem('token');
            
            // Fetch user data from your backend
            const response = await axios.get(`http://localhost:5000/users/${username}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
    
            console.log('Response:', response.data);
            const user = response.data;
    
            if (user && user.username && user.chips !== undefined) {
                console.log('User:', user.username);
                console.log('Chips:', user.chips);
                return {
                    username: user.username,
                    chips: user.chips
                };
            } else {
                console.error('Invalid user data');
                return null;
            }
        } catch (error) {
            console.error('Error fetching user data:', error);
            return null;
        }
    };
    

    const updatePlayerChips = async (username, chipsChange) => {
        if (!username || username === 'AI Player') {
            console.log('AI Player chips are managed separately or invalid username provided.');
            return;
        }
    
        try {
            const updatedChips = user.chips + chipsChange;
    
            // Update the local state immediately
            updateUserChips(updatedChips);
    
            // Update chips in the backend
            const token = localStorage.getItem('token');
            await axios.put(`http://localhost:5000/users/${username}/updateChips`, {
                chips: updatedChips,
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
    
            console.log(`${username} now has ${updatedChips} chips`);
        } catch (error) {
            console.error('Error updating chips:', error);
        }
    };
    
    // Add this function inside the GameBoard component
const handleCardClick = (cardIndex) => {
    // Only allow interaction if it's the player's turn and they've drawn a card
    if (currentTurn === 0 && hasDrawnCard) {
        discardCard(cardIndex, () => {
            console.log(`Player discarded card at index ${cardIndex}`);
            nextTurn();
        });
    } else if (currentTurn === 0 && !hasDrawnCard) {
        console.log("You must draw a card before discarding");
    }
};


const handleLeaveTable = async (username) => {
    try {
        // Update the server about player leaving
        await axios.post(`http://localhost:5000/tables/${tableId}/leave`, {
            username: username
        });

        // Emit socket event for real-time updates
        if (socket) {
            socket.emit('leave_table', {
                tableId: tableId,
                username: username
            });
        }

        // Navigate player back to lobby
        navigate('/lobby');
    } catch (error) {
        console.error('Error leaving table:', error);
    }
};

    const handleDrawCard = () => {
        if (currentTurn === 0 && !hasDrawnCard && deck.length > 0) {
            const updatedPlayerHands = [...playerHands];
            const updatedDeck = [...deck];
            updatedPlayerHands[currentTurn].push(updatedDeck.pop());
            setPlayerHands(updatedPlayerHands);
            setDeck(updatedDeck);
            setHasDrawnCard(true);
        }
    };

    const goToUserProfile = () => {
        navigate('/userprofile');
    };

    const forceReRender = () => {
        setRenderKey((prevKey) => prevKey + 1);
    };

    if (!user || playerHands.length === 0 || !deck) {
        return <div>Loading...</div>;
    }

    // Replace the existing return statement with this enhanced version
return (
    <div className="game-container">
        <div className="game-board">
            {/* Top Player */}
            <div className="player top">
                <PlayerInfo player={players[1]} />
                <PlayerHand cards={playerHands[1]} isHidden={true} />
               
                <PlayerSpreads spreads={playerSpreads[1]} />
            </div>
            
            {/* Middle Row with Side Players */}
            <div className="middle-row">
                <div className="player left">
                    <PlayerInfo player={players[2]} />
                    <PlayerHand cards={playerHands[2]}  isHidden={true}/>

                    <PlayerSpreads spreads={playerSpreads[2]} />
                </div>

                {/* Center Game Area */}
                <div className="center-area">
                    <div className="deck-and-discard">
                        <Deck 
                            cards={deck}
                            drawCard={handleDrawCard}
                            isActive={currentTurn === 0 && !hasDrawnCard}
                        />
                        <DiscardPile
                           cards={discardPile}
                           onClick={currentTurn === 0 && !hasDrawnCard ? handleDiscardPileClick : null}
                           isActive={currentTurn === 0 && !hasDrawnCard}
                       />
                        
                    </div>
                    <GameInfo 
                        pot={pot}
                        currentTurn={currentTurn}
                        players={players}
                    />
                </div>

                <div className="player right">
                    <PlayerInfo player={players[3]} />
                    <PlayerHand cards={playerHands[3]} />
                    <PlayerSpreads spreads={playerSpreads[3]} />
                </div>
            </div>

            {/* Bottom Player (User) */}
            <div className="player bottom">
                <PlayerInfo player={players[0]} />
                <PlayerHand 
                    cards={playerHands[0]}
                    isActive={currentTurn === 0}
                    onCardClick={handleCardClick}
                    isHidden={false}

                />
                <PlayerSpreads spreads={playerSpreads[0]} />
                {!gameOver && players[currentTurn].username !== "AI Player" && (
   <PlayerActions 
   isActive={true}
   canSpread={hasValidSpread}
   canHit={findValidHit() !== null}
   onSpread={handleSpread}
   onHit={() => {
       const validHit = findValidHit();
       if (validHit) {
           handleHit(validHit.cardIndex, validHit.targetPlayerIndex, validHit.spreadIndex);
       }
   }}
   onDrop={() => handleDrop(true)}
   hasDrawnCard={hasDrawnCard}
   canDrop={currentTurn === 0 && !hasDrawnCard} // Add this condition
/>
)}

            </div>
        </div>
        <div className="game-container">
        {/* Existing game board code */}
        
        {gameOver && (
            <GameEndOverlay 
            message={gameEndMessage}
            onNewGame={handleNewGame}
            players={players}
            onLeaveTable={handleLeaveTable}
        />
        )}
    </div>
    </div>
);

    
};

export default GameBoard;
