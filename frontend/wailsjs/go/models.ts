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

}

export namespace settings {
	
	export class Settings {
	    hashcatBinaryPath: string;
	    hashesDir: string;
	    dictionariesDir: string;
	    rulesDir: string;
	    masksDir: string;
	    outputDir: string;
	    defaultStatusTimer: number;
	    defaultWorkloadProfile: number;
	
	    static createFrom(source: any = {}) {
	        return new Settings(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.hashcatBinaryPath = source["hashcatBinaryPath"];
	        this.hashesDir = source["hashesDir"];
	        this.dictionariesDir = source["dictionariesDir"];
	        this.rulesDir = source["rulesDir"];
	        this.masksDir = source["masksDir"];
	        this.outputDir = source["outputDir"];
	        this.defaultStatusTimer = source["defaultStatusTimer"];
	        this.defaultWorkloadProfile = source["defaultWorkloadProfile"];
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

