import {KAConcurrent, KASequence} from "@coldcloude/kai2";

const start = Date.now();

await KASequence([
    ()=>{
        const time = (Date.now()-start)/1000;
        console.log("batch 0 start @ "+time+"s");
        return new Promise((cb)=>setTimeout(cb,1000));
    },
    async ()=>await KAConcurrent([
        async ()=>await KAConcurrent([
            ()=>{
                const time = (Date.now()-start)/1000;
                console.log("batch 1 task 0 start @ "+time+"s");
                return new Promise((cb)=>setTimeout(cb,500));
            },
            ()=>{
                const time = (Date.now()-start)/1000;
                console.log("batch 1 task 1 start @ "+time+"s");
                return new Promise((cb)=>setTimeout(cb,1500));
            }
        ]),
        ()=>{
            const time = (Date.now()-start)/1000;
            console.log("batch 2 start @ "+time+"s");
            return new Promise((cb)=>setTimeout(cb,1000));
        }
    ]),
    ()=>{
        const time = (Date.now()-start)/1000;
        console.log("batch 3 start @ "+time+"s");
        return new Promise((cb)=>setTimeout(cb,1000));
    }
]);

const time = (Date.now()-start)/1000;
console.log("all done @ "+time+"s");
