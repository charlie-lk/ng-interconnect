import { Component, EventEmitter } from '@angular/core';
import { Interconnect} from 'ng-interconnect'


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'lib-test';

  connectX: EventEmitter<any>;
  connectionMessage: String;
  myConnection;

  notifiedMessage: string;

  constructor(private connector: Interconnect) {
   
  }


  //---Connector tests
  public createConnection() {

    this.connectX = this.connector.createConnection('X');

    console.log(this.connector.connectionInfo());

  }

  public triggerConnection() {
    this.connectX.emit('foo');
  }

  public connectTo() {
    this.myConnection = this.connector.connectTo('X', 'xx', (val, error, complete) => {
      console.log(val);
      console.log(error);
      console.log(complete);
      this.connectionMessage = val;
      alert(val);
    });
    
    console.log(this.connector.connectionInfo());
  }

  public disconnect() {
    this.myConnection.disconnect();
    console.log(this.connector.connectionInfo());
  }


  //---- Notifier tests
  public async createNotifier() {
    this.notifiedMessage = await this.connector.createNotifier('y');
    
    console.log(this.notifiedMessage);
  }

  public triggerNotifier() {
    this.connector.notifiers('y').notify('bar')
  }




}
