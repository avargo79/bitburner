import { CityName, CorpIndustryName, CorpMaterialName, NS } from "../NetscriptDefinitions";

const CORPORTATION_NAME = "NorthStar";
const ALL_CITIES = Object.values(CityName);
const MATERIALS: CorpMaterialName[] = ["Minerals", "Ore", "Water", "Food", "Plants", "Metal", "Hardware", "Chemicals", "Drugs", "Robots", "AI Cores", "Real Estate"];
const BOOST_MATERIALS: CorpMaterialName[] = ["Hardware", "AI Cores", "Real Estate", "Robots"];

/** @param {NS} ns */
export async function main(ns: NS) {
	const corp = ns.corporation;

	// Create Corporation
	if (!corp.hasCorporation()) {
		corp.createCorporation(CORPORTATION_NAME, true) || corp.createCorporation(CORPORTATION_NAME, false);
	}

	// Create Division
	const industry: CorpIndustryName = "Agriculture";
	const industryData = corp.getIndustryData(industry);
	const divisionName = "AG";
	corp.expandIndustry(industry, divisionName);
	const division = corp.getDivision(divisionName);

	// Expand to all cities
	ALL_CITIES.filter((city) => !division.cities.includes(city)).forEach((city) => corp.expandCity(divisionName, city));

	// Reset all material prices
	ALL_CITIES.forEach((city) => MATERIALS.filter((material) => !BOOST_MATERIALS.includes(material)).forEach((material) => corp.sellMaterial(divisionName, city, material, "MAX", "MP")));

	// buy boost mats
	ALL_CITIES.forEach((city) => corp.buyMaterial(divisionName, city, "Hardware", 10 * <number>industryData.hardwareFactor));
	ALL_CITIES.forEach((city) => corp.buyMaterial(divisionName, city, "AI Cores", 10 * <number>industryData.aiCoreFactor));
	ALL_CITIES.forEach((city) => corp.buyMaterial(divisionName, city, "Real Estate", 10 * <number>industryData.realEstateFactor));
	ALL_CITIES.forEach((city) => corp.buyMaterial(divisionName, city, "Robots", 10 * <number>industryData.robotFactor));

	// hire employees
}
