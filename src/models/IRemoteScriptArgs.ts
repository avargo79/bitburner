export interface IHackScriptArgs {
    hostname: string;
    batchType: "hk" | "wk1" | "gr" | "wk2";
    type: "hack" | "grow" | "weaken";
    delayUntil: number;
}
