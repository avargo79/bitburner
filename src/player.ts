import { NS } from "@ns";

export default class BasePlayer {
  private ns: NS;
  private _id: string;

  constructor(ns: NS, id: string) {
      this.ns = ns;
      this._id = id;
  }

  get id() { return this._id }
  /**
   *  @returns {import(".").Player}
   */
  get data() { return this.ns.getPlayer(); }
  get updated_at() { return new Date().valueOf() }
  get hp() {
      return {
          current: this.data.hp.current,
          max: this.data.hp.max
      }
  }
  get level() { return this.data.skills.hacking }
  get money() { return this.data.money }
  get intelligence() { return this.data.exp.intelligence }
  get city() { return this.data.city }
  get company() {
      return {
          multipliers: {
              rep: this.data.mults.company_rep
          }
      }
  }
  get bladeburner() {
      return {
          multipliers: {
              analysis: this.data.mults.bladeburner_analysis,
              max_stamina: this.data.mults.bladeburner_max_stamina,
              stamina_gain: this.data.mults.bladeburner_stamina_gain,
              success_chance: this.data.mults.bladeburner_success_chance,
          }
      }
  }
  get charisma() {
      return {
          level: this.data.skills.charisma,
          exp: this.data.exp.charisma,
          multipliers: {
              exp: this.data.mults.charisma_exp,
              level: this.data.mults.charisma,
          }
      }
  }
  get agility() {
      return {
          level: this.data.skills.agility,
          exp: this.data.exp.agility,
          multipliers: {
              exp: this.data.mults.agility_exp,
              level: this.data.mults.agility,
          }
      }
  }
  get dexterity() {
      return {
          level: this.data.skills.dexterity,
          exp: this.data.exp.dexterity,
          multipliers: {
              exp: this.data.mults.dexterity_exp,
              level: this.data.mults.dexterity,
          }
      }
  }
  get defense() {
      return {
          level: this.data.skills.defense,
          exp: this.data.exp.defense,
          multipliers: {
              exp: this.data.mults.defense_exp,
              level: this.data.mults.defense,
          }
      }
  }
  get strength() {
      return {
          level: this.data.skills.strength,
          exp: this.data.exp.strength,
          multipliers: {
              exp: this.data.mults.strength_exp,
              level: this.data.mults.strength,
          }
      }
  }
  get faction() {
      return {
          membership: this.data.factions,
          multipliers: {
              rep: this.data.mults.faction_rep
          }
      }
  }
  get hacking() {
      return {
          exp: this.data.exp.hacking,
          level: this.data.skills.hacking,
          next_level_exp: Math.pow(Math.E, ((this.data.skills.hacking + 1) / (32 * this.data.mults.hacking_exp) + (25 / 4))) - (1069 / 2),
          tnl: Math.pow(Math.E, ((this.data.skills.hacking + 1) / (32 * this.data.mults.hacking_exp) + (25 / 4))) - (1069 / 2) - this.data.mults.hacking_exp,
          multipliers: {
              chance: this.data.mults.hacking_chance,
              exp: this.data.mults.hacking_exp,
              grow: this.data.mults.hacking_grow,
              money: this.data.mults.hacking_money,
              level: this.data.mults.hacking,
              speed: this.data.mults.hacking_speed
          }
      }
  }
  get hnet() {
      return {
          multipliers: {
              coreCost: this.data.mults.hacknet_node_core_cost,
              levelCost: this.data.mults.hacknet_node_level_cost,
              production: this.data.mults.hacknet_node_money,
              purchaseCost: this.data.mults.hacknet_node_purchase_cost,
              ramCost: this.data.mults.hacknet_node_ram_cost,
          }
      }
  }
  get market() {
      return {
          api: {
              tix: this.ns.stock.hasTIXAPIAccess(),
              fourSigma: this.ns.stock.has4SDataTIXAPI()
          },
          manual: {
              wse: this.ns.stock.hasWSEAccount(),
              fourSigma: this.ns.stock.has4SData()
          }
      }
  }
  get playtime() {
      return {
          total: this.data.totalPlaytime,
          sinceAug: this.ns.getResetInfo().lastAugReset,
          sinceBitnode: this.ns.getResetInfo().lastNodeReset
      }
  }

  get ports() {
      return this.ns.ls("home").filter(file => [
          "BruteSSH.exe",
          "FTPCrack.exe",
          "relaySMTP.exe",
          "HTTPWorm.exe",
          "SQLInject.exe"
      ].includes(file)).length
  }

  get software() {
      return {
          tor: this.ns.hasTorRouter(),
          ssh: this.ns.ls("home").some(file => file === "BruteSSH.exe"),
          ftp: this.ns.ls("home").some(file => file === "FTPCrack.exe"),
          smtp: this.ns.ls("home").some(file => file === "relaySMTP.exe"),
          http: this.ns.ls("home").some(file => file === "HTTPWorm.exe"),
          sql: this.ns.ls("home").some(file => file === "SQLInject.exe"),
          formulas: this.ns.ls("home").some(file => file === "Formulas.exe"),
      }
  }
}