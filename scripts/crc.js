import { log } from "./util.js";

class CR_Data {
    constructor(cr, prof, ac, hp, attackBonus, damage, save) {
        this.data = {cr, prof, ac, hp, attackBonus, damage, save}
    }
}

class Range {
    constructor(min, max=min) {
        this.data = {min, max}
    }

    contains(num) {
        return this.data.min <= num && this.data.max >= num
    }
}

let crs = [
    new CR_Data(0,	2,	13,	new Range(1, 6),	3,	new Range(0, 1),	13),
    new CR_Data(1/8,	2,	13,	new Range(7, 35),	3,	new Range(2, 3),	13),
    new CR_Data(1/4,	2,	13,	new Range(36, 49),	3,	new Range(4, 5),	13),
    new CR_Data(1/2,	2,	13,	new Range(50, 70),	3,	new Range(6, 8),	13),
    new CR_Data(1,	2,	13,	new Range(71, 85),	3,	new Range(9, 14),	13),
    new CR_Data(2,	2,	13,	new Range(86, 100),	3,	new Range(15, 20),	13),
    new CR_Data(3,	2,	13,	new Range(101, 115),	4,	new Range(21, 26),	13),
    new CR_Data(4,	2,	14,	new Range(116, 130),	5,	new Range(27, 32),	14),
    new CR_Data(5,	3,	15,	new Range(131, 145),	6,	new Range(33, 38),	15),
    new CR_Data(6,	3,	15,	new Range(146, 160),	6,	new Range(39, 44),	15),
    new CR_Data(7,	3,	15,	new Range(161, 175),	6,	new Range(45, 50),	15),
    new CR_Data(8,	3,	16,	new Range(176, 190),	7,	new Range(51, 56),	16),
    new CR_Data(9,	4,	16,	new Range(191, 205),	7,	new Range(57, 62),	16),
    new CR_Data(10,	4,	17,	new Range(206, 220),	7,	new Range(63, 68),	16),
    new CR_Data(11,	4,	17,	new Range(221, 235),	8,	new Range(69, 74),	17),
    new CR_Data(12,	4,	17,	new Range(236, 250),	8,	new Range(75, 80),	17),
    new CR_Data(13,	5,	18,	new Range(251, 265),	8,	new Range(81, 86),	18),
    new CR_Data(14,	5,	18,	new Range(266, 280),	8,	new Range(87, 92),	18),
    new CR_Data(15,	5,	18,	new Range(281, 295),	8,	new Range(93, 98),	18),
    new CR_Data(16,	5,	18,	new Range(296, 310),	9,	new Range(99, 104),	18),
    new CR_Data(17,	6,	19,	new Range(311, 325),	10,	new Range(105, 110),	19),
    new CR_Data(18,	6,	19,	new Range(326, 340),	10,	new Range(111, 116),	19),
    new CR_Data(19,	6,	19,	new Range(341, 355),	10,	new Range(117, 122),	19),
    new CR_Data(20,	6,	19,	new Range(356, 400),	10,	new Range(123, 140),	19),
    new CR_Data(21,	7,	19,	new Range(401, 445),	11,	new Range(141, 158),	20),
    new CR_Data(22,	7,	19,	new Range(446, 490),	11,	new Range(159, 176),	20),
    new CR_Data(23,	7,	19,	new Range(491, 535),	11,	new Range(177, 194),	20),
    new CR_Data(24,	7,	19,	new Range(536, 580),	12,	new Range(195, 212),	21),
    new CR_Data(25,	8,	19,	new Range(581, 625),	12,	new Range(213, 230),	21),
    new CR_Data(26,	8,	19,	new Range(626, 670),	12,	new Range(231, 248),	21),
    new CR_Data(27,	8,	19,	new Range(671, 715),	13,	new Range(249, 266),	22),
    new CR_Data(28,	8,	19,	new Range(716, 760),	13,	new Range(267, 284),	22),
    new CR_Data(29,	9,	19,	new Range(761, 805),	13,	new Range(285, 302),	22),
    new CR_Data(30,	9,	19,	new Range(806, 850),	14,	new Range(303, 320),	23)
]

function getDefensiveCR(data) {
    let {ac, hp} = data.data.attributes
    let baseIndex = crs.findIndex(cr=>cr.data.hp.contains(hp.value))
    if(baseIndex) {
        let base = crs[baseIndex]
        let expectedAC = base.data.ac
        let currentAC = ac.value
        let diff = Math.floor((currentAC - expectedAC) / 2)
        return Math.min(crs.length - 1, Math.max(0, (baseIndex + diff)))
    }
}

function getAverageBy(arr, fun) {
    let value = arr.filter(fun).sort((a,b)=>{
            let ap = fun(a)
            let bp = fun(b)
            return ap < bp ? 1 : ap > bp ? -1 : 0
        })
        .filter((x,i)=>i < 3)
        .reduce((p,c,_,a)=>p + (fun(c)/a.length), 0)
    return Math.round(value)
}

function getAverageDamage(items) {
    let multiattack = items
            .filter(i=>i.name.toLowerCase().indexOf("multiattack") !== -1)
            .map(i=>{
                let description = i.data.data.description.value
                let [number] = (description.match(/(\d+)/) || [2])
                return parseInt(number)
            })[0] || 1
    let results = items.map(i=>{
        let rollData = i.getRollData()
        let result = {}
        if(i.hasDamage) {
            let damageParts = i.data.data.damage.parts
            let damage = damageParts.map(damage=>{
                let n = 100;
                let roll = new Roll(damage[0], i.getRollData())
                return Array.apply(null, Array(n))
                        .map(()=>roll.reroll())
                        .reduce((p,c)=>(p + (c.total/n)), 0)
            }).reduce((p,c)=>p+c,0)
            if(i.data.data.actionType == "mwak" || i.data.data.actionType == "rwak") {
                damage *= multiattack
            }
            result.damage = damage
        }
        if(i.hasSave) {
            result.save = i.data.data.save.dc
        }
        if(i.hasAttack) {
            result.attackBonus = rollData.mod + i.data.data.attackBonus
        }
        return result
    }).filter(r=>r !== {})
    let damage = getAverageBy(results, r=>r.damage)
    let save = getAverageBy(results, r=>r.save)
    let attackBonus = getAverageBy(results, r=>r.attackBonus)
    return {damage, save, attackBonus}
}

function getOffensiveCR(items) {
    let {damage, save, attackBonus} = getAverageDamage(items)
    log("Calculating damage averages", {damage, save, attackBonus})
    let baseIndex = crs.findIndex(cr=>cr.data.damage.contains(damage))
    if(baseIndex) {
        let base = crs[baseIndex]
        let diff = 0
        if(attackBonus > 0) {
            let expectedAB = base.data.attackBonus
            diff += Math.floor((attackBonus - expectedAB) / 2)
        }
        if(save > 0) {
            let expectedDC = base.data.save
            diff += Math.floor((save - expectedDC) / 2)
        }
        return Math.min(crs.length - 1, Math.max(0, (baseIndex + diff)))
    }
}

Hooks.on('renderActorSheet', (app, html, data) => {
    let actor = app.object
    if(!actor.isToken && actor.owner) {
        let title = game.i18n.localize('CRC.Button');
        let openBtn = $(`<a class="crc-button" title="${title}"><i class="fas fa-calculator"></i></a>`);
        openBtn.click(async ev => {
            log("Opening for", app, data)
            let defensiveIndex = getDefensiveCR(actor.data)
            log("Defensive", defensiveIndex, crs[defensiveIndex])
            let offensiveIndex = getOffensiveCR(actor.items)
            log("Offensive", offensiveIndex, crs[offensiveIndex])
            if(offensiveIndex && defensiveIndex) {
                let index = Math.floor((defensiveIndex + offensiveIndex) / 2)
                let cr = crs[index]
                await actor.update({"data.details.cr": cr.data.cr})
            }
        });
        html.closest('.app').find('.crc-button').remove();
        let titleElement = html.closest('.app').find('.window-title');
        openBtn.insertAfter(titleElement);
    }
});