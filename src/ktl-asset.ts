import { KHashTable, KMap, KObject, KSerializable, setFromArray, strcmp, strhash } from "@coldcloude/kai2";
import { Day, dayn } from "./ktl";

export const ASSET_GENERAL = 0|0;
export const ASSET_FUTURE = 1|0;
export const ASSET_OPTION = 2|0;
export const ASSET_BOND = 3|0;
export const ASSET_CURRENCY = 4|0;

const POOL = new KHashTable<string,Asset>(strcmp,strhash);

export function registerAsset(asset:Asset){
    POOL.set(asset.name,asset);
}

export function findAsset(name:string){
    const r = POOL.get(name)!;
    if(r!==undefined){
        return r;
    }
    else{
        throw "no asset '"+name+"' found";
    }
}

export function existAsset(name:string):boolean{
    return POOL.contains(name);
}

export function absentAssets(names:string[]|KMap<string,void>):string[]{
    const map = (names instanceof KMap)?names:setFromArray(names as string[],strcmp,strhash);
    map.removeIf((n)=>POOL.contains(n));
    return map.keyToArray();
}

export class Asset implements KSerializable{
    readonly name:string;
    readonly type:number;
    constructor(nameX:string|KObject,type?:number){
        if(typeof nameX === "string"){
            this.name = nameX as string;
            this.type = type!;
        }
        else{
            this.name = nameX.name as string;
            this.type = nameX.type as number;
        }
    }
    toObj():KObject{
        return {
            name: this.name,
            type: this.type
        };
    }
}

export class AssetFuture extends Asset{
    readonly mature:Day;
    readonly underlying:Asset;
    constructor(nameX:string|KObject,type?:number,mature?:Day,underlying?:Asset){
        super(nameX,type);
        if(typeof nameX === "string"){
            this.mature = mature!;
            this.underlying = underlying!;
        }
        else{
            this.mature = nameX.mature as number;
            this.underlying = findAsset(nameX.underlying as string)!;
        }
    }
    toObj():KObject{
        const obj = super.toObj();
        obj.mature = dayn(this.mature);
        obj.underlying = this.underlying.name;
        return obj;
    }
}

export class AssetOption extends AssetFuture{
    readonly exercise:number;
    readonly direction:number;
    constructor(nameX:string|KObject,type?:number,mature?:Day,underlying?:Asset,exercise?:number,direction?:number){
        super(nameX,type,mature,underlying);
        if(typeof nameX === "string"){
            this.exercise = exercise!;
            this.direction = direction!;
        }
        else{
            this.exercise = nameX.exercise as number;
            this.direction = nameX.direction as number;
        }
    }
    toObj():KObject{
        const obj = super.toObj();
        obj.exercise = this.exercise;
        obj.direction = this.direction;
        return obj;
    }
}
