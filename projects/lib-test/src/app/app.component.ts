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
  yReceiver;
  xReceiver;
  cConnection;
  bConnection;

  notifiedMessage: string;

  constructor(private interconnect: Interconnect) {
   
  }


  //---Connector tests
  public createBroadcaster() {

    this.broadcaster = this.interconnect.createBroadcaster('X');

    console.log(this.interconnect.info());

  }

  public triggerBroadcaster() {
    this.broadcaster.emit('foo');
  }

  public receiveFromXY() {
    this.yReceiver = this.interconnect.receiveFrom('X', 'Y', (val, error, complete) => {
      console.log(val);
      console.log(error);
      console.log(complete);
      alert(val);
    });
    
    console.log(this.interconnect.info());
  }


  public receiveFromXZ() {
    this.xReceiver = this.interconnect.receiveFrom('X', 'Z', (val, error, complete) => {
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
    this.notifiedMessage = await this.interconnect.createNotifier('y');
    
    console.log(this.notifiedMessage);
  }

  public triggerNotifier() {
    this.interconnect.notifiers('y').notify('bar')
  }


  //---- Listener tests

  public createListener() {
    this.interconnect.createListener('A', (connectionName, data, error, complete) => {

      console.log(`From ${connectionName}: ${data}, ${error}, ${complete}`);
      alert(connectionName + ' - ' + data);
    })
  }


  public connectToAB() {
    this.bConnection = this.interconnect.connectToListener('A', 'B');
  }


  public connectToAC() {
    this.cConnection = this.interconnect.connectToListener('A', 'C');
  }

  public sendMessageAB() {
    this.bConnection.emit('Ball')
  }

  public sendMessageAC() {
    this.cConnection.emit('Cat');
  }




}
