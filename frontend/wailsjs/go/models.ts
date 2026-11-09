export namespace services {
	
	export class RegistrationPayload {
	    idempotencyKey: string;
	    fullName: string;
	    email: string;
	    countryCode: string;
	    phone: string;
	    companyName: string;
	    businessRegNo: string;
	    businessType: string;
	    businessSize: string;
	    country: string;
	    city: string;
	    state: string;
	    postalCode: string;
	    address: string;
	    customDomain: string;
	    hearAboutUs: string;
	    password: string;
	    enablePasskey: boolean;
	    biometricHash: string;
	    termsAccepted: boolean;
	    tenantId: string;
	    timestamp: number;
	
	    static createFrom(source: any = {}) {
	        return new RegistrationPayload(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.idempotencyKey = source["idempotencyKey"];
	        this.fullName = source["fullName"];
	        this.email = source["email"];
	        this.countryCode = source["countryCode"];
	        this.phone = source["phone"];
	        this.companyName = source["companyName"];
	        this.businessRegNo = source["businessRegNo"];
	        this.businessType = source["businessType"];
	        this.businessSize = source["businessSize"];
	        this.country = source["country"];
	        this.city = source["city"];
	        this.state = source["state"];
	        this.postalCode = source["postalCode"];
	        this.address = source["address"];
	        this.customDomain = source["customDomain"];
	        this.hearAboutUs = source["hearAboutUs"];
	        this.password = source["password"];
	        this.enablePasskey = source["enablePasskey"];
	        this.biometricHash = source["biometricHash"];
	        this.termsAccepted = source["termsAccepted"];
	        this.tenantId = source["tenantId"];
	        this.timestamp = source["timestamp"];
	    }
	}

}

