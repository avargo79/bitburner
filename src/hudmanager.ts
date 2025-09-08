import { NS } from "@ns";

export async function main(ns: NS): Promise<void> {
    const doc: Document = eval('document');
    const hook0 = doc.getElementById('overview-extra-hook-0') as HTMLParagraphElement;
    const hook1 = doc.getElementById('overview-extra-hook-1') as HTMLParagraphElement;

    // Hook script exit to clean up after ourselves.
    ns.atExit(() => {
        hook1.innerHTML = hook0.innerHTML = "";
    });

    while (true) {
        const player = ns.getPlayer();

        hook1.innerHTML = hook0.innerHTML = "";

        const hudRows: Record<string, { value: string, tooltip?: string }> = {};
        hudRows.Karma = { value: ns.formatNumber(player.karma, 3), tooltip: `Needed -54k to create gang - (${player.karma}/ -54k)` };
        // hudRows["Loc"] = { value: player.city, tooltip: '' };

        for (const key of Object.keys(hudRows)) {
            const row1 = doc.createElement('p');

            const span1 = doc.createElement('span');
            span1.innerHTML = key;
            row1.appendChild(span1);
            hook0.appendChild(row1);

            const row2 = doc.createElement('p');
            const span2 = doc.createElement('span');
            span2.innerHTML = hudRows[key].value;
            span2.title = hudRows[key].tooltip ?? '';
            row2.appendChild(span2);
            hook1.appendChild(row2);
        }

        await ns.sleep(2000);
    }
}