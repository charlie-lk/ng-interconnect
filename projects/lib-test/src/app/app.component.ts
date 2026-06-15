import { Component } from '@angular/core';
import { Interconnect, IMessageStream} from 'ng-interconnect'


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'lib-test';

  broadcaster: IMessageStream;
  brdP: IMessageStream;
  brdQ: IMessageStream;
  yReceiver;
  xReceiver;
  cConnection;
  bConnection;

  notifiedMessage: string;

  constructor(private interconnect: Interconnect) {
   
  }


  //---Broadcaster tests
  public createBroadcaster() {

    this.broadcaster = this.interconnect.createBroadcaster('X/X');

    console.log(this.interconnect.info());

  }

  public triggerBroadcaster() {
    this.broadcaster.emit('foo', {matchNS: new RegExp('^Z\/Z$')});
  }

  public receiveFromXY() {
    this.yReceiver = this.interconnect.receiveFrom('X/X', 'Y/Y', (val, error, complete, bName) => {
      console.log('Y/Y');
      console.log(val);
      console.log(error);
      console.log(complete);
      alert(val);
    });
    

    if (this.yReceiver.then)
      this.yReceiver.then(()=> {
        console.log('Broadcaster available');
      })


    console.log(this.interconnect.info());
  }


  public receiveFromXZ() {
    this.xReceiver = this.interconnect.receiveFrom('X/X', 'Z/Z', (val, error, complete, bName) => {
      console.log('Z/Z');
      console.log(val);
      console.log(error);
      console.log(complete);
      alert(val);
    });
    
    console.log(this.interconnect.info());
  }

  public disconnectXY() {
    this.yReceiver.disconnect();
    console.log(this.interconnect.info());
  }

  public disconnectXZ() {
    this.xReceiver.disconnect();
    console.log(this.interconnect.info());
  }


  //---- Notifier tests
  public async createNotifier() {
    this.notifiedMessage = await this.interconnect.createNotifier('y/y');
    
    console.log(this.notifiedMessage);
  }

  public triggerNotifier() {
    this.interconnect.notifiers('y/y').notify('bar')
  }


  //---- Listener tests

  public createListener() {
    this.interconnect.createListener('A/A', (connectionName, data, error, complete) => {

      console.log(`From ${connectionName}: ${data}, ${error}, ${complete}`);
      alert(connectionName + ' - ' + data);
    })
  }


  public connectToAB() {
    this.bConnection = this.interconnect.connectToListener('A/A', 'B/B');

    if (this.bConnection.then)
      this.bConnection.then((messageStream) => {
        console.log('Listener available');

        this.bConnection = messageStream;
      })
  }


  public connectToAC() {
    this.cConnection = this.interconnect.connectToListener('A/A', 'C/C');
  }

  public sendMessageAB() {
    this.bConnection.emit('Ball')
  }

  public sendMessageAC() {
    this.cConnection.emit('Cat');
  }


  //Multi broadcaster reception test

  public createBroadcastersPQ() {
    this.brdP = this.interconnect.createBroadcaster('multitest/p');
    this.brdQ = this.interconnect.createBroadcaster('multitest/q');
  }

  public triggerBroadcasterP() {
    this.brdP.emit('from P');
  }

  public triggerBroadcasterQ() {
    this.brdQ.emit('from Q');
  }

  public receiveFromPandQ_R() {
    this.interconnect.receiveFrom(['multitest/p', 'multitest/q'], 'mltitest/r', (d, e, c, bName) => {
      alert(bName);
    })
  }




}
