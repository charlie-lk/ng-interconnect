import { Component, EventEmitter } from '@angular/core';
import { Interconnect} from 'ng-interconnect'


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'lib-test';

  connectorX: EventEmitter<any>;
  connectionMessage: String;
  myConnection;

  notifiedMessage: string;

  constructor(private interconnect: Interconnect) {
   
  }


  //---Connector tests
  public createConnector() {

    this.connectorX = this.interconnect.createConnector('X');

    console.log(this.interconnect.info());

  }

  public triggerConnector() {
    this.connectorX.emit('foo');
  }

  public connectTo() {
    this.myConnection = this.interconnect.connectTo('X', 'xx', (val, error, complete) => {
      console.log(val);
      console.log(error);
      console.log(complete);
      this.connectionMessage = val;
      alert(val);
    });
    
    console.log(this.interconnect.info());
  }

  public disconnect() {
    this.myConnection.disconnect();
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




}
