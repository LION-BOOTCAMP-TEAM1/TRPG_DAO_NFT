function saveStoryToLocalStorage (state: string) {
    try {
      const serializedState = JSON.stringify(state);
      localStorage.setItem("story", serializedState);
    } catch (e) {
      console.warn("Failed to save state to localStorage", e);
    }
};

function loadStoryFromLocalStorage () {
    try {
      const serializedState = localStorage.getItem("story");
      if (serializedState === null) return undefined;
      return JSON.parse(serializedState);
    } catch (e) {
      console.warn("Failed to load state from localStorage", e);
      return undefined;
    }
};

function clearStory () {
    localStorage.removeItem("story");
};

export { saveStoryToLocalStorage, loadStoryFromLocalStorage, clearStory };