import { NS } from "@ns";

export async function main(ns: NS): Promise<void> {
	const doc = eval("document"); // This is expensive! (25GB RAM) Perhaps there's a way around it? ;)
	const hook0 = doc.getElementById("overview-extra-hook-0");
	const hook1 = doc.getElementById("overview-extra-hook-1");

	ns.atExit(() => {
		hook0.innerHTML = "";
		hook1.innerHTML = "";
	});

	while (true) {
		try {
			const headers = [];
			const values = [];
			// Add script income per second
			headers.push("Karma");
			values.push(Math.floor(ns.heart.break()));
			// TODO: Add more neat stuff

			// Now drop it into the placeholder elements
			hook0.innerText = headers.join(" \n");
			hook1.innerText = values.join("\n");
		} catch (err) {
			// This might come in handy later
			ns.print("ERROR: Update Skipped: " + String(err));
		}
		await ns.sleep(1000);
	}
}
