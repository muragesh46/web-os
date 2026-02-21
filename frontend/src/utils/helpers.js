// Helper functions used throughout the app
export const formatDate = (date) => {
    return new Intl.DateTimeFormat('en-US').format(date);
};
