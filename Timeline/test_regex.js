const appState = {currentDate: '1105-001'};
let textBase = `This is a test.
| Date | Zhodani Date | Event |
|---|---|---|
| 1105-001 | | event |
`;
if (textBase.includes('| Date |')) {
    textBase = textBase.replace(/(\| Date \|[\s\S]*)/, `**Current Date:** ${appState.currentDate}\n\n$1`);
}
const tableBlockRegex = /(\|\s*Date\s*\|\s*Zhodani Date\s*\|\s*Event\s*\|[\s\S]*?(?=\n\n|\n$|$))/m;
const newTable = `| Date | Zhodani Date | Event |
|---|---|---|
| 1105-002 | | new |
`;
if (tableBlockRegex.test(textBase)) {
    textBase = textBase.replace(tableBlockRegex, newTable);
} else {
    textBase += "\n\n" + newTable;
}
console.log(textBase);
