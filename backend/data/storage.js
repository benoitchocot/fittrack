let templates = [];
let history = [];

module.exports = {
  getTemplates: () => templates,
  setTemplates: (newTemplates) => { templates = newTemplates; },

  getHistory: () => history,
  setHistory: (newHistory) => { history = newHistory; },
};
