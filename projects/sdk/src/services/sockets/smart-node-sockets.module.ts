import { NgModule } from '@angular/core';
import { SmartNodeNetworkModule } from '../network/smart-node-network.module';
import { SmartNodeSocketsService } from './smart-node-sockets.service';

@NgModule({
  imports: [
    SmartNodeNetworkModule
  ],
  providers: [
    SmartNodeSocketsService
  ],
  exports: []
})
export class SmartNodeSocketsModule { }
