export namespace hashcat {

	export class HashcatArgs {
	    Session?: string;
	    AttackMode?: number;
	    HashMode?: number;
	    Dictionaries?: string[];
	    Rules?: string[];
	    Mask?: string;
	    MaskFile?: string;
	    CustomCharset1?: string;
	    CustomCharset2?: string;
	    CustomCharset3?: string;
	    CustomCharset4?: string;
	    EnableMaskIncrementMode?: boolean;
	    MaskIncrementMin?: number;
	    MaskIncrementMax?: number;
	    Hash?: string;
	    Quiet?: boolean;
	    DisablePotFile?: boolean;
	    DisableLogFile?: boolean;
	    EnableOptimizedKernel?: boolean;
	    EnableSlowerCandidateGenerators?: boolean;
	    RemoveFoundHashes?: boolean;
	    IgnoreUsernames?: boolean;
	    DisableSelfTest?: boolean;
	    IgnoreWarnings?: boolean;
	    DevicesIDs?: number[];
	    DevicesTypes?: number[];
	    WorkloadProfile?: number;
	    DisableMonitor?: boolean;
	    TempAbort?: number;
	    MarkovDisable?: boolean;
	    MarkovClassic?: boolean;
	    MarkovThreshold?: number;
	    ExtraArguments?: string[];
	    StatusTimer?: number;
	    OutputFile?: string;
	    OutputFormat?: number[];

	    static createFrom(source: any = {}) {
	        return new HashcatArgs(source);
	    }

	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.Session = source["Session"];
	        this.AttackMode = source["AttackMode"];
	        this.HashMode = source["HashMode"];
	        this.Dictionaries = source["Dictionaries"];
	        this.Rules = source["Rules"];
	        this.Mask = source["Mask"];
	        this.MaskFile = source["MaskFile"];
	        this.CustomCharset1 = source["CustomCharset1"];
	        this.CustomCharset2 = source["CustomCharset2"];
	        this.CustomCharset3 = source["CustomCharset3"];
	        this.CustomCharset4 = source["CustomCharset4"];
	        this.EnableMaskIncrementMode = source["EnableMaskIncrementMode"];
	        this.MaskIncrementMin = source["MaskIncrementMin"];
	        this.MaskIncrementMax = source["MaskIncrementMax"];
	        this.Hash = source["Hash"];
	        this.Quiet = source["Quiet"];
	        this.DisablePotFile = source["DisablePotFile"];
	        this.DisableLogFile = source["DisableLogFile"];
	        this.EnableOptimizedKernel = source["EnableOptimizedKernel"];
	        this.EnableSlowerCandidateGenerators = source["EnableSlowerCandidateGenerators"];
	        this.RemoveFoundHashes = source["RemoveFoundHashes"];
	        this.IgnoreUsernames = source["IgnoreUsernames"];
	        this.DisableSelfTest = source["DisableSelfTest"];
	        this.IgnoreWarnings = source["IgnoreWarnings"];
	        this.DevicesIDs = source["DevicesIDs"];
	        this.DevicesTypes = source["DevicesTypes"];
	        this.WorkloadProfile = source["WorkloadProfile"];
	        this.DisableMonitor = source["DisableMonitor"];
	        this.TempAbort = source["TempAbort"];
	        this.MarkovDisable = source["MarkovDisable"];
	        this.MarkovClassic = source["MarkovClassic"];
	        this.MarkovThreshold = source["MarkovThreshold"];
	        this.ExtraArguments = source["ExtraArguments"];
	        this.StatusTimer = source["StatusTimer"];
	        this.OutputFile = source["OutputFile"];
	        this.OutputFormat = source["OutputFormat"];
	    }
	}
	export class HashcatBinaryInfo {
	    valid: boolean;
	    version: string;
	    algorithms: Record<number, string>;
	    error: string;

	    static createFrom(source: any = {}) {
	        return new HashcatBinaryInfo(source);
	    }

	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.valid = source["valid"];
	        this.version = source["version"];
	        this.algorithms = source["algorithms"];
	        this.error = source["error"];
	    }
	}

}

export namespace hashescom {

	export class EscrowJob {
	    id: number;
	    state?: string;
	    createdAt: string;
	    lastUpdate: string;
	    algorithmName: string;
	    algorithmId: number;
	    totalHashes: number;
	    foundHashes: number;
	    leftHashes: number;
	    currency: string;
	    pricePerHash: string;
	    pricePerHashUsd: string;
	    maxCracksNeeded: number;
	    leftList: string;
	    foundList?: string;

	    static createFrom(source: any = {}) {
	        return new EscrowJob(source);
	    }

	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.state = source["state"];
	        this.createdAt = source["createdAt"];
	        this.lastUpdate = source["lastUpdate"];
	        this.algorithmName = source["algorithmName"];
	        this.algorithmId = source["algorithmId"];
	        this.totalHashes = source["totalHashes"];
	        this.foundHashes = source["foundHashes"];
	        this.leftHashes = source["leftHashes"];
	        this.currency = source["currency"];
	        this.pricePerHash = source["pricePerHash"];
	        this.pricePerHashUsd = source["pricePerHashUsd"];
	        this.maxCracksNeeded = source["maxCracksNeeded"];
	        this.leftList = source["leftList"];
	        this.foundList = source["foundList"];
	    }
	}

}

export namespace main {

	export class AssetFolders {
	    hashesDir: string;
	    dictionariesDir: string;
	    rulesDir: string;
	    masksDir: string;

	    static createFrom(source: any = {}) {
	        return new AssetFolders(source);
	    }

	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.hashesDir = source["hashesDir"];
	        this.dictionariesDir = source["dictionariesDir"];
	        this.rulesDir = source["rulesDir"];
	        this.masksDir = source["masksDir"];
	    }
	}
	export class HashesComEscrowJobsResult {
	    enabled: boolean;
	    authenticated: boolean;
	    jobs: hashescom.EscrowJob[];

	    static createFrom(source: any = {}) {
	        return new HashesComEscrowJobsResult(source);
	    }

	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.enabled = source["enabled"];
	        this.authenticated = source["authenticated"];
	        this.jobs = this.convertValues(source["jobs"], hashescom.EscrowJob);
	    }

		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class ScannedAssets {
	    hashes: string[];
	    dictionaries: string[];
	    rules: string[];
	    masks: string[];

	    static createFrom(source: any = {}) {
	        return new ScannedAssets(source);
	    }

	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.hashes = source["hashes"];
	        this.dictionaries = source["dictionaries"];
	        this.rules = source["rules"];
	        this.masks = source["masks"];
	    }
	}
	export class SetupState {
	    required: boolean;
	    running: boolean;
	    hashcatBinaryPath: string;
	    hashcatInstallDir: string;
	    valid: boolean;
	    version: string;
	    error: string;

	    static createFrom(source: any = {}) {
	        return new SetupState(source);
	    }

	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.required = source["required"];
	        this.running = source["running"];
	        this.hashcatBinaryPath = source["hashcatBinaryPath"];
	        this.hashcatInstallDir = source["hashcatInstallDir"];
	        this.valid = source["valid"];
	        this.version = source["version"];
	        this.error = source["error"];
	    }
	}

}

export namespace settings {

	export class Settings {
	    hashcatBinaryPath: string;
	    hashcatInstallDir: string;
	    setupComplete: boolean;
	    hashesDir: string;
	    dictionariesDir: string;
	    rulesDir: string;
	    masksDir: string;
	    outputDir: string;
	    defaultStatusTimer: number;
	    defaultWorkloadProfile: number;
	    theme: string;
	    escrowEnabled: boolean;
	    hashesComApiKey: string;

	    static createFrom(source: any = {}) {
	        return new Settings(source);
	    }

	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.hashcatBinaryPath = source["hashcatBinaryPath"];
	        this.hashcatInstallDir = source["hashcatInstallDir"];
	        this.setupComplete = source["setupComplete"];
	        this.hashesDir = source["hashesDir"];
	        this.dictionariesDir = source["dictionariesDir"];
	        this.rulesDir = source["rulesDir"];
	        this.masksDir = source["masksDir"];
	        this.outputDir = source["outputDir"];
	        this.defaultStatusTimer = source["defaultStatusTimer"];
	        this.defaultWorkloadProfile = source["defaultWorkloadProfile"];
	        this.theme = source["theme"];
	        this.escrowEnabled = source["escrowEnabled"];
	        this.hashesComApiKey = source["hashesComApiKey"];
	    }
	}

}

export namespace tasks {

	export class TaskInfo {
	    id: string;
	    arguments: string[];
	    state: string;
	    created_at: number;

	    static createFrom(source: any = {}) {
	        return new TaskInfo(source);
	    }

	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.arguments = source["arguments"];
	        this.state = source["state"];
	        this.created_at = source["created_at"];
	    }
	}

}

