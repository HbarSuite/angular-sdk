import { Injectable } from '@angular/core';
import { Node } from './interfaces/node.interface';
import { Observable, Subject } from 'rxjs';
import { Storage } from '@capacitor/storage';
import axios from 'axios';

@Injectable({
  providedIn: 'root'
})
export class SmartNodeNetworkService {
  private nodeObserver = new Subject<any>();
  private nodeObservable = this.nodeObserver.asObservable();

  private nodes: Array<Node> = new  Array<Node>();
  private node: Node = {
    operator: '',
    publicKey: '',
    url: ''
  };

  private network = {
    mainnet: [
      {
        "operator": "0.0.1027975",
        "publicKey": "302a300506032b657003210061b21f8a50b8e95a2597517bbd6e230e62328862c117c56a1b3e94e178186e69",
        "url": "https://mainnet-sn1.hbarsuite.network"
      },      
      {
        "operator": "0.0.1027976",
        "publicKey": "302a300506032b6570032100669c63617353f5181af0455e79c22688a0c7f69db169f7958c03bcab0dab8d97",
        "url": "https://mainnet-sn2.hbarsuite.network"
      },
      {
        "operator": "0.0.1027978",
        "publicKey": "302a300506032b65700321004a83f50907014c41b6e297a67fe4351c232822d6660e5470f0da912362d46164",
        "url": "https://mainnet-sn3.hbarsuite.network"
      },
      {
        "operator": "0.0.1027979",
        "publicKey": "302a300506032b6570032100efc5eed0ba886f711c261ffd816aef05d70bc5c894037fc3ae0b354e26a243f6",
        "url": "https://mainnet-sn4.hbarsuite.network"
      }
    ],
    testnet: [
      {
        "operator": "0.0.47967256",
        "publicKey": "302a300506032b6570032100b67830db2219b586d1c90966aab191dd563b24467a92cf19cddc5037baa697bf",
        "url": "https://testnet-sn1.hbarsuite.network"
      },
      {
        "operator": "0.0.47967257",
        "publicKey": "302a300506032b6570032100fbbb06fd81e06dd396a23cd01b40ed3dacb62ef86ecc8b27c379872882e25629",
        "url": "https://testnet-sn2.hbarsuite.network"
      },
      {
        "operator": "0.0.47967258",
        "publicKey": "302a300506032b6570032100b6fa69608c3a6c7269f17f89f956fb0fef37104e76d09836f95720c30a6e0736",
        "url": "https://testnet-sn3.hbarsuite.network"
      },
      {
        "operator": "0.0.47967259",
        "publicKey": "302a300506032b6570032100be801aa5424f4c468412a2bf871beda8f8db70f787b86a757026bc20b25d8270",
        "url": "https://testnet-sn4.hbarsuite.network"
      }
    ],
    local: [
      {
        "operator": "0.0.47967256",
        "publicKey": "302a300506032b6570032100b67830db2219b586d1c90966aab191dd563b24467a92cf19cddc5037baa697bf",
        "url": "http://localhost:3001"
      },      
      {
        "operator": "0.0.47967257",
        "publicKey": "302a300506032b6570032100fbbb06fd81e06dd396a23cd01b40ed3dacb62ef86ecc8b27c379872882e25629",
        "url": "http://localhost:3002"
      },
      {
        "operator": "0.0.47967258",
        "publicKey": "302a300506032b6570032100b6fa69608c3a6c7269f17f89f956fb0fef37104e76d09836f95720c30a6e0736",
        "url": "http://localhost:3003"
      },
      {
        "operator": "0.0.47967259",
        "publicKey": "302a300506032b6570032100be801aa5424f4c468412a2bf871beda8f8db70f787b86a757026bc20b25d8270",
        "url": "http://localhost:3004"
      }    
    ]
  };

  constructor() {}

  getNodeObserver(): Observable<any> {
    return this.nodeObservable;
  }

  public async setNetwork(network: 'mainnet' | 'testnet' | 'local', node: string, override: boolean = false): Promise<boolean> {
    return new Promise(async(resolve, reject) => {
      try {
        // as very first, we setup the core network...
        this.nodes = this.network[network];
        // setting a random node to use as default one...
        if(node == 'random') {
          await this.shuffleNode(override);
        } else {
          this.node = this.getSpecificNode(Number(node));
        }
        
        // then we fetch the entire network of nodes, and we update our nodes array...
        try {
          let whitelistedNetwork = await this.getNetwork();
          this.nodes = whitelistedNetwork.data;          
          resolve(true);
        } catch(error) {
          resolve(await this.setNetwork(network, node, true));
        }
      } catch(error) {
        reject(error);
      }
    })
  }

  async getNetwork(): Promise<any> {
    return new Promise(async(resolve, reject) => {
      try {
        // then we call the endpoint to grab the entire list of nodes...
        let response = await this.getApiEndpoint('smart-node/network');
        // finally, we can resolve it...
        resolve({
          function: 'getNetwork',
          node: this.node,
          data: response
        });
      } catch(error) {
        reject(error);        
      }
    });
  }

  public getCurrentNode(): Node {
    return this.node;
  }

  public setCurrentNode(node: Node): void {
    this.node = node;
  }

  public async getRandomNode(override: boolean): Promise<Node> {
    let auth = await Storage.get({key: 'hashconnect.auth'});
    let node = null;

    if(auth.value && !override) {
      let authStorage = JSON.parse(auth.value);
      node = this.nodes.find(node => node.operator == authStorage.signedPayload.originalPayload.node);
    } else {
      node = this.nodes[Math.floor(Math.random() * this.nodes.length)];
    }

    return node;
  }

  public getSpecificNode(index: number): Node {
    return this.nodes[index];
  }

  public async shuffleNode(override: boolean): Promise<void> {
    this.node = await this.getRandomNode(override);
  }

  public setNodeFromActiveNodes(activeNodes: Array<Node>): void {
    if(activeNodes.length) {
      this.node = activeNodes[Math.floor(Math.random() * activeNodes.length)];
      this.nodeObserver.next(this.node);
    } else {
      throw new Error(`the list of active nodes can't be empty`);
    }
  }

  async postApiEndpoint(endpoint: string, params: any = {}, config: any = {}): Promise<any> {
    return new Promise(async(resolve, reject) => {
      try {
        let response = await this.callApiEndpoint('post', endpoint, params, config);
        resolve(response);
      } catch(error) {
        reject(error);
      }
    });
  }

  async getApiEndpoint(endpoint: string, params: any = {}): Promise<any> {
    return new Promise(async(resolve, reject) => {
      try {
        let response = await this.callApiEndpoint('get', endpoint, params);
        resolve(response);
      } catch(error) {
        reject(error);
      }
    });
  }

  private async callApiEndpoint(
    type: 'get' | 'post',
    endpoint: string, 
    params: any = {}, 
    config: any = {}, 
    trials: number = 0
  ): Promise<any> {
    return new Promise(async(resolve, reject) => {
      try {
        // try to call the required api endpoint...
        let response = null;

        if(this.node.url != '') {
          switch(type) {
            case 'get':
              response = await axios.get(`${this.node.url}/${endpoint}`, params);
              break;
            case 'post':
              response = await axios.post(`${this.node.url}/${endpoint}`, params, config);
              break;
          }
  
          this.nodeObserver.next(this.node);
          resolve(response.data);          
        } else {
          resolve(response);
        }
      } catch(error) {
        reject(error);
      }
    });
  }
}
