lineage
=======

Family Tree Data Expression Engine

See a live demo at
http://www.bengarvey.com/lineage
(still an older version)

## Quickstart guide

Clone this repo
```
git clone git@github.com:bengarvey/lineage.git
cd lineage
python3 -m http.server 8000
```
Click [http://localhost:8000](http://localhost:8000)

## Slowstart guide

## Running locally
You can run this locally by running `python3 -m http.server 8000` from a terminal or running the following commands

```
npm install
```
And then every time after that running `node server.js`

## Configuration

All configuration is done in the `config.json` file.
This is what its keys do:

- **`data`**: Points to the JSON file containing your data. By default, it points to the example file located at `data/familyData.json`.
  
- **`startDate`**: The initial date when the graph is loaded.

- **`firstDate`**: Earliest date you can go back to.

- **`lastDate`**: Latest date you can go to. 

- **`speed`**: Defines how many milliseconds before the next "tick" of the timer runs.

- **`timeStep`**: How much real time passes with each tick of the timer. Valid values are "day", "week" and "year"

- **`menuDefaultOpen`**: If set to `true`, the menu is instantly opened when the web view is loaded. The default is `true`.

- **`debug`**: This key does not affect the observable behavior of lineage and only affects the background logging.

- **`showDead`**: If set to `false`, only people alive at the time of the currently active year are shown in the graphs. If set to `true`, everyone born by this time (regardless of death date) is shown.

- **`filter`**: In the web view's menu bar, you can filter for specific names using the provided input field. This key allows you to set an initial filter that will be active when the web view is freshly loaded.

## Notes
- For viewing large datasets, it may help to zoom out your browser
- If you lose the ui, move your mouse to the edge of the screen at the top left
- To run the demo in play mode, just press play and watch the years tick by
- To hear the music, check the music checkbox and press play

## Generating new datasets
- There's a script in the script directory called famgen.js. Run it like this to generate new datasets. 
```
node script/famgen.js > data/familyData.json
```

## Upcoming features / ToDo
- Better readme for using this with your own data
- Support for incrementing by day instead of year
- Handle more generic network data that needs to be viewed in a time series
- Non-browser zoom, since the browser zoom is limited. 
