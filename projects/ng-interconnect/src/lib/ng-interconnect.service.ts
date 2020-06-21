import { Injectable, EventEmitter } from '@angular/core';
import { Observable } from 'rxjs';


interface IConnection {
  observable: Observable<any>,
  event: EventEmitter<any>
  info: any
}

interface INotifier {
  notify: any,
  error: any
}

interface IObserverClient {
  observer: any,
  clientName: string
}

@Injectable({
  providedIn: 'root'
})
export class Interconnect {

  private connections: { [key: string]: IConnection } = {};
  private _notifiers: {} = {};
  private currentClientName: string = '';


  constructor() { }

  //Connections --------
  public createConnection(name: string): EventEmitter<any> {

    if (this.connections[name])
      return this.connections[name].event;

    //A new host
    this.connections[name] = <IConnection> {};

    //Create the subscriber function and the event
    let subscriberPackage = this.subscriberFactory(name);

    this.connections[name].observable = new Observable(subscriberPackage.subscriberFn);
    this.connections[name].event = subscriberPackage.event; ////Save it for returning when the same connection is attempted to be created again
    this.connections[name].info = subscriberPackage.info;

    return subscriberPackage.event;
  }

  public connectTo(connectionName: string, clientName: string, callback: any, context?) {

    if (!this.connections[connectionName] || !clientName) 
      throw "This connection cannot be found"
    else
      var connection = this.connections[connectionName];


    this.currentClientName = clientName;

    var subscription = connection.observable.subscribe({
      next(e) {
        callback(e, null, null)
      },

      error(e) {
        callback(null, e, null)
      },

      complete() {
        callback(null, null, true);
      }

    })

    return {
      disconnect() {
        subscription.unsubscribe();
      }
    }


  }

  public connectionInfo() {

    let ret = {};

    for (let [key, value] of Object.entries(this.connections))
      ret[key] = value.info()

    return ret;
 
  }

  //Notifiers --------
  public createNotifier(name: string) {

    if (this._notifiers[name])
      return this._notifiers[name].p;

    var classContext = this;
    var p =  new Promise<any>((resolve, reject) => {

      this._notifiers[name] = {

        notify(data: any) {
          resolve(data);
          delete classContext._notifiers[name];
        },

        error(error: any) {
          reject(error);
          delete classContext._notifiers[name];
        },

        promise: p      //Save it for returning when the same notifier is attempted to be created again
      }

    })

    return p;
  }

  public notifiers(name: string): INotifier {

    if (!this._notifiers[name])
      throw "Notifier not found";

    return this._notifiers[name];
  }

  private subscriberFactory(ConnectionName: string) {

    //Factory to return a subscriber function with multicast support

    //All observers are saved here
    const observers: IObserverClient[] = [];

    const event: EventEmitter<any> = new EventEmitter();

    const classContext = this;

    let eventSubscribed: boolean = false; //To indicate the first subscriber has arrived and the event is subscribed


    const subscriberFn = function (observer) {

      //If this is the same client, remove the old observer
      for (let [i, observableClient] of observers.entries()) {
        if (observableClient.clientName === classContext.currentClientName){
          observers.splice(i, 1);
        }
      }

      observers.push({
        observer,
        clientName: classContext.currentClientName
      });



      //Subscribe to the event when the first observer appears
      if (!eventSubscribed) {

        eventSubscribed = true;
        classContext.handleEvents(event, 
          
          //next
          (e) => {
            observers.forEach((observableClient) =>  observableClient.observer.next(e));
          },

          //error
          (e) => {
            observers.forEach((observableClient) =>  observableClient.observer.error(e));          
          },

          //complete
          () => {
            observers.forEach((observableClient) =>  {
              observableClient.observer.complete();
              observableClient.observer.unsubscribe();
            });

            observers.length = 0;

            classContext.connections[ConnectionName].observable = null;
            delete classContext.connections[ConnectionName];
          }
          
        )

      }

      return {
        unsubscribe() {

          for (let [i, observableClient] of observers.entries())
            if (observableClient.observer === observer)
              observers.splice(i, 1);
        } 
      }

    }    


    return {event, subscriberFn, info: () => {
      return observers.map((observer) => observer.clientName);
    }};
  }


  private handleEvents(event: EventEmitter<any>, next: any, error: any, complete: any) {


    event.subscribe(

      //next
      (e) => {
        next(e);
      },

      //error
      (e) => {
        error(e);
      },

      //complete
      (e) => {
        complete(e);
      }


    )

  }









}
