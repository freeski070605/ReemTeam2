
export const calculateStakeWinnings = (type, stake, playerCount) => {
    switch(type) {
        case 'REEM':
            return stake * 2 * (playerCount - 1);
        case 'DROP_WIN':
            return stake * (playerCount - 1);
        case 'DROP_CAUGHT':
            return -stake * (playerCount - 1);
        case 'REGULAR_WIN':
            return stake * (playerCount - 1);
        default:
            return 0;
    }
};
