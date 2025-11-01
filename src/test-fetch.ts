import { NS } from '@ns';

/** Test if fetch works from within Bitburner */
export async function main(ns: NS): Promise<void> {
    ns.tprint('Testing fetch to ngrok HTTPS endpoint...');

    try {
        // Test 1: Fetch to Ollama via CORS proxy on port 8080
        ns.tprint('Test 1: Fetching to http://localhost:8080/api/tags');
        const response1 = await fetch('http://localhost:8080/api/tags');
        ns.tprint(`  Status: ${response1.status} ${response1.statusText}`);
        const data1 = await response1.json();
        ns.tprint(`  Models: ${JSON.stringify((data1 as any).models?.map((m: any) => m.name) || [])}`);
        ns.tprint('  ✓ SUCCESS - Can reach Ollama via ngrok!');
    } catch (error) {
        ns.tprint(`  ✗ FAILED: ${(error as Error).message}`);
    }

    ns.tprint('');

    try {
        // Test 2: Fetch to external site
        ns.tprint('Test 2: Fetching to https://api.github.com');
        const response2 = await fetch('https://api.github.com');
        ns.tprint(`  Status: ${response2.status} ${response2.statusText}`);
        ns.tprint('  ✓ SUCCESS - Can reach external sites!');
    } catch (error) {
        ns.tprint(`  ✗ FAILED: ${(error as Error).message}`);
    }

    ns.tprint('');
    ns.tprint('Test complete!');
}
