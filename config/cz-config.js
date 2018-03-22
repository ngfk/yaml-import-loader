'use strict';

const typesMap = {
    feat: 'Add a new feature',
    fix: 'A bug fix',
    refactor: 'A code change that neither fixes a bug nor adds a feature',
    docs: 'Documentation only changes',
    perf: 'A code change that improves performance',
    test: 'Adding missing tests',
    chore:
        'Changes to the build process or auxiliary tools\n' +
        '            and libraries such as documentation generation.'
};

const types = Object.keys(typesMap).map(key => ({
    value: key,
    name: `${key}:${' '.repeat(10 - key.length - 1)}${typesMap[key]}`
}));

const scopes = ['core', 'meta'];

module.exports = {
    types,
    scopes,
    scopeOverrides: {
        chore: [{ name: 'meta' }]
    },
    allowCustomScopes: false
};
