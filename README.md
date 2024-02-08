# Lung function visualization

<!-- [<img alt="Unit tests" src="https://img.shields.io/github/actions/workflow/status/rwarnking/lufuvis-light/pytests.yml?label=Tests&logo=github&style=for-the-badge" height="23">](https://github.com/rwarnking/lufuvis-light/actions/workflows/pytests.yml) -->
[<img alt="Linting status of master" src="https://img.shields.io/github/actions/workflow/status/rwarnking/lufuvis-light/linter.yml?label=Linter&style=for-the-badge" height="23">](https://github.com/marketplace/actions/super-linter)
<!-- [<img alt="Version" src="https://img.shields.io/github/v/release/rwarnking/lufuvis-light?style=for-the-badge" height="23">](https://github.com/rwarnking/lufuvis-light/releases/latest) -->
<!-- [<img alt="Licence" src="https://img.shields.io/github/license/rwarnking/lufuvis-light?style=for-the-badge" height="23">](https://github.com/rwarnking/lufuvis-light/blob/main/LICENSE) -->

## Description
This is a visualization for presenting lung function data. You can inspect the result via [Github pages](https://rwarnking.github.io/lufuvis-light/).

## Table of Contents
- [Lung function visualization](#lung-function-visualization)
  - [Table of Contents](#table-of-contents)
  - [List of Features](#list-of-features)
  - [Installation](#installation)
    - [Dependencies](#dependencies)
  - [Usage](#usage)
    - [GUI](#gui)
  - [Contributing](#contributing)
  - [Credits](#credits)
  - [License](#license)

## List of Features

## Installation

Download this repository or install directly from GitHub
```bash
pip install git+https://github.com/rwarnking/lufuvis-light.git
```

<!-- This project uses python, make sure you have Python >=3.7 installed. -->
<!-- Furthermore: -->
1. Make sure npm is installed ([https://www.npmjs.com](https://www.npmjs.com))
2. Run `npm install` in the console

### Dependencies

<!-- Use either
```bash
pip install -r requirements.txt
```
to install all dependencies.

Or use Anaconda for your python environment and create a new environment with
```bash
conda env create --file lufuvis.txt
```
afterwards activate the environment (`conda activate lufuvis`) and start the application. -->

The main dependency is the anvil tool found here:
<!-- * [flask](https://pypi.org/project/Flask/) for the flask server -->
* ...

Further dependencies that should be present anyway are:
* ...

Optional dependencies:
* ...

## Usage

### Start

<!-- To run the Flask server run:
```bash
python server.py
``` -->

For the website:
1. Run `npm run dev` in the console
2. The application should run at [http://127.0.0.1:3000/lufuvis-light/](http://127.0.0.1:3000/lufuvis-light/)

### GUI

TODO

## Contributing

TODO

## Credits
TODO

## License
TODO

## TODOs

- limit overview charts in max height
- improve panning and zooming
- decide whether y-scale should start with 0 or should be cropped
- increase right border
- allow for missing data
  - add support for only post data
  - add support for exams where certain measurements are missing
- predefine order of measurements
- add categories to sort the measurements by
