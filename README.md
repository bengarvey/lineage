lineage
=======

Family Tree Data Expression Engine

See a live demo at
http://www.bengarvey.com/lineage

## Running locally
You can run this locally by running `python3 -m http.server 8000` from a terminal or running the following commands

```
npm install
npm install connect
npm install serve-static
```
And then every time after that running `node server.js`

## Configuration

All configuration is done in the `config.json` file.
This is what its keys do:

### `data`
Points to the JSON-file containing your data.
Per default, this points to the example file located at
`data/familyData.json`.

### `filter`
In the web view's menu bar you can filter for specific names using the provided
input field.
This key allows you to set an initial filter which will be active when the web
view is freshly loaded.

### `startYear`
StartYear

### `endYear`
EndYear

### `speed`
How many milliseconds does one year take when you hit the "Play" button?
Default value is 100 which makes 10 years pass per second
(100ms = 1/10th of a second).

### `menuDefaultOpen`
If this is set to `true`, the menu is instantly opened when the web view is
loaded.
Defaults to `true`.

### `debug`
This key is irrelevant to the observable behavior of lineage and only affects
the logging which happens in the background.

### `showDead`
If this is false, only people who are alive at the time of the currently active
year are shown in the graphs.
If it's true, everybody who has been born at this time (regardless of death
date) is shown.


## Notes
- For viewing large datasets, it may help to zoom out your browser
- If you lose the ui, move your mouse to the edge of the screen at the top left
- To run the demo in play mode, just press play and watch the years tick by
- To hear the music, check the music checkbox and press play
- To see the full dataset in the demo, remove all the names from the search /
    filter box


## Upcoming features / ToDo
- Move to D3v7?
