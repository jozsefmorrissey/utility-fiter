
function convertToFraction(target) {
    let denoms = [2,4,8,16,32];
    let closest = {dist: 1};
    let integer = Math.floor(target);
    if (integer == target) {
        return { mixed: target + "", value: target};
    }
    for (let dIndex = 0; dIndex < denoms.length; dIndex += 1) {
        let denom = denoms[dIndex];
        for (let num = 1; num < denom; num += 1) {
            let value = num/denom + integer;
            let mixed = (integer === 0 ? '' : integer + " ") + num + "/" + denom;
            let dist = Math.abs(value - target);
            if (dist < closest.dist) {
                closest = { value, mixed, dist};
            }
        }
    }
    delete closest.dist;
    return closest;
}

let nextPartCode = 'A';
function newPartCode() {
  const code = nextPartCode;
  nextPartCode = nextPartCode.substr(0, nextPartCode.length - 1) + String.fromCharCode(code.charCodeAt(code.length - 1) + 1);
  for (let index = nextPartCode.length - 1; index > -1; index -= 1) {
    if (nextPartCode[index] === '[') {
      if (index == 0) {
        nextPartCode = 'A' + nextPartCode.substr(1) + 'A';
      } else {
        nextPartCode = nextPartCode.substr(0, index - 1) +
                        String.fromCharCode(nextPartCode.charCodeAt(index - 1) + 1) +
                        'A' +
                        nextPartCode.substr(index + 1);
      }
    }
  }
  return code;
}

configs = {};

configs.duelDrawerVanity = {
    width: {},
    height: {},
    length: {},
    tableTopSideOverHang: {value: 1.5},
    tableTopFrontOverHang: {value: 2},
    tableTopThickness: {value: 1},
    doorFraction: {value: 2/3},
    toeBoardHeight: {value: 3},
    materialThickness: {value: .75},
    doorThickness: {value: .75},
    backThickness: {value: 1/8},
    tableTop: {func: function() {return {length: this.length.value,
                                        width: this.width.value,
                                        height: this.tableTopThickness.value};},
                count: {value: 1}},
    side: {func: function() {return {length: this.height.value - this.tableTopThickness.value,
                                    width: this.width.value - this.tableTopFrontOverHang.value - this.doorThickness.value,
                                    height: this.materialThickness.value};},
                count: {value: 2}},
    toeBoard: {func: function() {return {length: this.length.value - (this.tableTopSideOverHang.value * 2) - (this.materialThickness.value * 2),
                                    width: this.toeBoardHeight.value,
                                    height: this.materialThickness.value};},
                count: {value: 1}},
    bottom: {func: function() {return {length: this.toeBoard.length.value,
                                    width: this.side.width.value - this.backThickness.value,
                                    height: this.materialThickness.value}},
                count: {value: 1}},
    topRunner: {func: function() {return {length: this.toeBoard.length.value,
                                    width: 2,
                                    height: this.materialThickness.value}},
                count: {value: 2}},
    internalSides: {func: function() {return {length: this.side.length.value - this.toeBoard.width.value - (this.materialThickness.value * 2),
                                    width: this.bottom.width.value,
                                    height: this.materialThickness.value}},
                count: {value: 1}},
    cabinet: {func: function() {return {length: this.topRunner.length.value + ( this.materialThickness.value * 2),
                                    width: this.side.width.value,
                                    height: this.side.height.value}},
                count: {value: 2}},
    shelfSeperators: {func: function() { let emptySpace = (this.cabinet.length.value - this.materialThickness.value * 4);
                                    return {length: (emptySpace - (emptySpace * this.doorFraction.value)) / 2,
                                    width: 2,
                                    height: this.materialThickness.value}},
                count: {value: 6}}
}

// string [length formula], [width formula], [height formula], [count formula]
configs.duelDrawerRefVanity = {
    width: {},
    height: {},
    length: {},
  	shelfCount: {value: 6},
    tableTopSideOverHang: {value: 1.5},
    tableTopFrontOverHang: {value: 2},
    tableTopThickness: {value: 1},
    doorFraction: {value: 2/3},
    toeBoardHeight: {value: 3},
    materialThickness: {value: .75},
    doorThickness: {value: .75},
    backThickness: {value: 1/8},
  	drawerSlideWidth: {value: 3/16},
  	drawerBottomGap: {value: 1/8},
  	drawerTopGap: {value: 3/4},
  	drawerMaterialThickness: {value: 1/2},
  	drawerDadoDepth: {value: 1/8},
  	drawerSlideBackSpace: {value: 1/2},
  	drawerFaceGap: {value: 1/8},
    tableTop: "$length, $width, $tableTopThickness, 1",
    side: "$height - $tableTopThickness, $width - $tableTopFrontOverHang - $doorThickness, $materialThickness, 2",
    toeBoard: "$length - ($tableTopSideOverHang * 2) - ($materialThickness * 2), $toeBoardHeight, $materialThickness, 1",
    bottom: "$toeBoard.length, $side.width - $backThickness, $materialThickness, 1",
    topRunner: "$toeBoard.length, 2, $materialThickness, 2",
    internalSides: "$side.length - $toeBoard.width - ($materialThickness * 2), $bottom.width, $materialThickness, 2",
    cabinet: "$topRunner.length + ($materialThickness * 2), $width, $side.height, 2",
    emptySpace: "($cabinet.length - $materialThickness * 4)",
    shelfSeperator: "($emptySpace - ($emptySpace * $doorFraction)) / 2, 2, $materialThickness, $shelfCount - 2",
  	drawerDems: "$side.length - $drawerSlideBackSpace, $shelfSeperator.length, $drawerMaterialThickness, $shelfCount",
  	drawerSpace: "$internalSides.length - ($materialThickness * ($shelfCount - 2) / 2)",
  	drawerSide: "$drawerDems.length, ($drawerSpace / $shelfCount) - ($drawerBottomGap + $drawerTopGap), $drawerMaterialThickness, $shelfCount * 2",
  	drawerFrontBack: "$shelfSeperator.length, $drawerSide.width, $drawerMaterialThickness, $shelfCount * 2",
  	drawerCoverTopBottom: "($materialThickness * 3/2) + $shelfSeperator.length - ($drawerFaceGap * 3/2), $drawerSpace + ($materialThickness * 3/2) - $drawerFaceGap, $doorThickness, 4",
  	drawerCoverInner: "$drawerCoverTopBottom.length, $drawerSpace + $materialThickness - $drawerFaceGap, $doorThickness, $shelfCount - 4",
  	cabnetDoor: "(($cabnet.length - ((4 + $shelfSeperator.length * 2) + ($materialThickness * 3))) / 2) - $drawerFaceGap, $internalSides.width + $materialThickness - $drawerFaceGap, $doorThickness, 2"
}

configs.simpleDrawer = {
  openingHeight: {},
  openingWidth: {},
  openingDepth: {},
  count: {value: 1},
  bottomGap: {value: 0.5},
  topGap: {value: 1/2},
  slideWidth: {value: 17/32},
  slideDepthBuffer: {value: 1/2},
  thickness: {value: 0.5},
  bottomThickness: {value: 1/2},
  dedoDepth: {value: 1/4},
  height: '$openingHeight - $bottomGap - $topGap',
  width: '$openingWidth - $slideWidth * 2',
  depth: {value: 18},
  side: '$depth, $height, $thickness, 2 * $count',
  front: '$width - ($thickness * 2), $height - 7/8, $thickness, 2 * $count',
  bottom: '$front.length + ($dedoDepth * 2), $depth, $bottomThickness, $count'
}

configs.towelCabnet = {
  length: {},
  width: {},
  height: {},
  thickness: {value: 3/4},
  backThickness: {value: 1/4},
  side: '$height, $width, $thickness, 2',
  topBottom: '$length, $width, $thickness, 2',
  back: '$height, $length, $backThickness, 1'
}

configs.seperateDuelDrawerVanity = {
  length: {},
  width: {},
  height: {},
  kickDepth: {value: 3.5},
  kickHeight: {value: 4},
  thickness: {value: 3/4},
  backThickness: {value: 1/4},
  cabnetFraction: {value: 1/2},
  drawerCount: {value: 6},
  backThicknessDedo: {value: 1/4},
  cabnetOpeningWidth: '(($length - 6 * $thickness) * $cabnetFraction)',
  drawerOpeningWidth: '(($length - 6 * $thickness) - $cabnetOpeningWidth) / 2',
  drawerOpeningDepth: '$width - $backThickness',
  side: '$height, $width, $thickness, 4',
  innerSide: '$height - $kickHeight - $thickness, $width - $backThickness, $thickness, 1',
  innerSideRunner: '$innerSide.length, 4, $thickness, 2',
  cabnetBottom: '$cabnetOpeningWidth + $drawerOpeningWidth + $thickness * 2, $width, $thickness, 1',
  drawerBottom: '$drawerOpeningWidth, $width, $thickness, 1',
  largeBack: '$cabnetBottom.length + ($backThicknessDedo * 2), $height - $kickHeight, $backThickness, 1',
  smallBack: '$drawerBottom.length + ($backThicknessDedo * 2), $largeBack.width, $backThickness, 1',
  shelfSeperator: '$drawerOpeningWidth, 4, $thickness, $drawerCount - 2',
  drawerTopRunner: '$drawerOpeningWidth, 4, $thickness, 4',
  cabnetTopRunner: '$cabnetOpeningWidth, 4, $thickness, 2',
  toeKick: '$length, $kickHeight, $thickness, 1',
  totalDrawerOpeningHeight: '($innerSide.length - ($drawerCount / 2) * $thickness)',
  topDrawerOpeningHeight: {value: 6},
  topDrawer: 'calcDems(\'simpleDrawer\', {openingHeight: $topDrawerOpeningHeight, openingWidth: $drawerOpeningWidth, openingDepth: $drawerOpeningDepth, count: 2})',
  remainingDrawers: '(($drawerCount / 2) - 1)',
  remainingDrawerOpeningHeight: '($totalDrawerOpeningHeight - $topDrawerOpeningHeight) / $remainingDrawers',
  drawer: 'calcDems(\'simpleDrawer\', {openingHeight: $remainingDrawerOpeningHeight, openingWidth: $drawerOpeningWidth, openingDepth: $drawerOpeningDepth, count: $remainingDrawers * 2})'
}

const varReg = /\$[a-zA-Z0-9.]*/g;
function evalRefStr(str) {
  const matches = str.match(varReg);
  for (let index = 0; matches && index < matches.length; index += 1) {
    const ref = matches[index].substr(1);
    const path = ref.split('.');
    let value = this;
    for (let pathIndex = 0; pathIndex < path.length; pathIndex += 1) {
      value = value[path[pathIndex]];
    }
    if (value == undefined || value.value === undefined) {
      throw new Error('Variable not defined: $' + ref);
    }
    str = str.replace(new RegExp('\\$' + ref, 'g'), value.value);
  }
  const evaluated = eval(str);
  if ((typeof evaluated) !== 'object') {
    return convertToFraction(evaluated);
  } else {
    return evaluated;
  }
}

const valueReg = /^([^,]*|[a-zA-Z0-9]*\(.*\))$/;
function parseRefStr(str) {
  if (str.match(valueReg)) {
      return evalRefStr.apply(this, [str]);
  }
  const split = str.split(',');
  if (split.length < 3) {
    throw new Error('invalid reference \n\tformat: [length formula], [width formula], [height formula], [count formula]\n\tvalue: ' + str);
  }
  const retObj = {};
  retObj.length = evalRefStr.apply(this, [split[0]]);
  retObj.width = evalRefStr.apply(this, [split[1]]);
  retObj.height = evalRefStr.apply(this, [split[2]]);
	if (split.length > 3) {
  	retObj.count = evalRefStr.apply(this, [split[3]]);
  }
  return retObj;
}

function testParseReg() {
  const keys = Object.keys(configs.duelDrawerRefVanity);
  for (let index = 0; index < keys.length; index += 1) {
    console.log(keys[index]);
    const value = configs.duelDrawerRefVanity[keys[index]];
    configs.duelDrawerRefVanity.length = {value: 58};
    configs.duelDrawerRefVanity.width = {value: 24};
    configs.duelDrawerRefVanity.height = {value: 32};
   	if ((typeof value) === 'string') {
      configs.duelDrawerRefVanity[keys[index]] = parseRefStr.apply(configs.duelDrawerRefVanity, [value]);
      console.log(configs.duelDrawerRefVanity);
    }
  }
}

function sortPartsSurfaceArea(part1, part2) {
  if (part1.height.value != part2.height.value) {
    return part2.height.value - part1.height.value;
  }
  return (part2.length.value * part2.width.value) - (part1.length.value * part1.width.value);
}

// glacierbay conf #: 457215
function printParts(id, parts) {
  let printStr = id + "\n";
  parts.sort(sortPartsSurfaceArea);
  for (let index = 0; index < parts.length; index += 1) {
    const part = parts[index];
    part.code = newPartCode();
    part.print = part.length.mixed + " x " + part.width.mixed + " x " + part.height.mixed;
    printStr += part.code + '\t' + part.count.value + "\t" + part.print + "\t" + part.name + '\n';
  }
  console.log(printStr);
}

function calcDems(id, setup) {
    const parts = [];
    if (!configs[id]) {
        return 'Invalid config Id\n\tChoose from:\n\t\t' + Object.keys(configs);
    } else {
        let config = configs[id];
        let modConfig = JSON.parse(JSON.stringify(config));
        let setupKeys = Object.keys(setup);
        for (let sIndex = 0; sIndex < setupKeys.length; sIndex += 1) {
            modConfig[setupKeys[sIndex]].value = setup[setupKeys[sIndex]];
        }
        let keys = Object.keys(config);
        for (let index = 0; index < keys.length; index += 1) {
            let attr = modConfig[keys[index]];
            let configAttr = config[keys[index]];
            if ((typeof attr !== 'string') && attr.value === undefined && configAttr.func === undefined) {
                throw new Error('define yo shit: ' + keys[index]);
            } else if ((typeof attr) === 'string') {
              attr = parseRefStr.apply(modConfig, [attr]);
              modConfig[keys[index]] = attr;
           } else if (attr.value) {
                let conversion = convertToFraction(attr.value);
                attr.value = conversion.value;
                attr.mixed = conversion.mixed;
            } else {
                let dems = configAttr.func.apply(modConfig, []);
                let length = convertToFraction(dems.length);
                attr.length = length;
                let width = convertToFraction(dems.width);
                attr.width = width;
                let height = convertToFraction(dems.height);
                attr.height = height;
            }
            if (attr.count) {
              attr.name = keys[index];
              parts.push(attr);
            }
        }
        printParts(id, parts);
        return {modConfig, parts};
    }
}

function getSheet() {
  const sheet = [];
  for (let index = 0; index < 96 * 4; index += 1) {
    sheet.push([]);
    for (let jIndex = 0; jIndex < 48 * 4; jIndex += 1) {
      sheet[index].push({used: false});
    }
  }
  return sheet;
}
