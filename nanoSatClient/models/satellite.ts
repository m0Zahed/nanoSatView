export default class Satellite {
  sat_id: string;
  norad_cat_id: number;
  norad_follow_id: number | null;
  name: string;
  names: string;
  image: string;
  status: string;
  decayed: Date | null;
  launched: Date;
  deployed: Date | null;
  website: string;
  operator: string;
  countries: string;
  telemetries: any[];
  updated: Date;
  citation: string;
  is_frequency_violator: boolean;
  associated_satellites: any[];

  constructor(data: any) {
    this.sat_id = data.sat_id;
    this.norad_cat_id = data.norad_cat_id;
    this.norad_follow_id = data.norad_follow_id;
    this.name = data.name;
    this.names = data.names;
    this.image = data.image;
    this.status = data.status;
    this.decayed = data.decayed ? new Date(data.decayed) : null;
    this.launched = new Date(data.launched);
    this.deployed = data.deployed ? new Date(data.deployed) : null;
    this.website = data.website;
    this.operator = data.operator;
    this.countries = data.countries;
    this.telemetries = data.telemetries;
    this.updated = new Date(data.updated);
    this.citation = data.citation;
    this.is_frequency_violator = data.is_frequency_violator;
    this.associated_satellites = data.associated_satellites;
  }

  toJSON() {
    return {
      sat_id: this.sat_id,
      norad_cat_id: this.norad_cat_id,
      norad_follow_id: this.norad_follow_id,
      name: this.name,
      names: this.names,
      image: this.image,
      status: this.status,
      decayed: this.decayed ? this.decayed.toISOString() : null,
      launched: this.launched.toISOString(),
      deployed: this.deployed ? this.deployed.toISOString() : null,
      website: this.website,
      operator: this.operator,
      countries: this.countries,
      telemetries: this.telemetries,
      updated: this.updated.toISOString(),
      citation: this.citation,
      is_frequency_violator: this.is_frequency_violator,
      associated_satellites: this.associated_satellites,
    };
  }
  

}
