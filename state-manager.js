let lastSentArray = [];

function hasArrayChanged(currentArray) {
    if (currentArray.length === 0) return false;

    if (JSON.stringify(currentArray) !== JSON.stringify(lastSentArray)) {
        lastSentArray = [...currentArray];
        return true;
    }
    return false;
}

module.exports = {
    hasArrayChanged,
};