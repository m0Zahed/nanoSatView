import Typesense, {Client} from 'typesense';

// TODO Add a configuration to set the IP address
class TypesenseClientSingleton {
  private static instance: Client | null = null;

  private constructor() {}

  public static getInstance(): Client {
    if (this.instance === null) {
      this.instance = this._getClientLocal();
    }
    return this.instance;
  }

  private static _getClientLocal(): Client {
    return new Client({
      nodes: [
        {
          host: 'localhost',
          port: 8108,
          protocol: 'http',
        },
      ],
      apiKey: 'xyz',
      connectionTimeoutSeconds: 2,
    });
  }
}

export default TypesenseClientSingleton;

