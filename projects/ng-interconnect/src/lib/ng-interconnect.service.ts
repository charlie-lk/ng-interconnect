import { Injectable, EventEmitter } from '@angular/core';
import { Observable } from 'rxjs';
import { Event } from '@angular/router';


export interface IMessageStream {
  emit: any,
  error: any,
  complete: any
}

interface IBroadcaster {
  observable: Observable<any>,
  broadcasterObject: IMessageStream,
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

interface IWaitingReceiver {
  name: string;
  callback: any;
  subscriptionResolver: any;
}

interface IWaitingConnection {
  name: string,
  messageStreamResolver: any
}

interface IListener {
  event: EventEmitter<any>;
  subscription: any;
}

@Injectable({
  providedIn: 'root'
})
export class Interconnect {

  private _broadcasters: { [key: string]: IBroadcaster } = {};
  private _notifiers: {} = {};
  private _listeners: {[key: string]: IListener} = {};

  private _waitingReceivers: {[key: string]: IWaitingReceiver[]} = {};
  private _waitingConnections: {[key: string]: IWaitingConnection[]} = {};

  private currentReceiverName: string = '';
  private currentConnectionName: string = '';


  constructor() { }

  //Broadcaster --------
  public createBroadcaster(name: string): IMessageStream {

    if (this._broadcasters[name])
      return this._broadcasters[name].broadcasterObject;

    //A new Broadcaster
    this._broadcasters[name] = <IBroadcaster> {};

    //Create the subscriber function and the event
    let subscriberPackage = this.subscriberFactory(name);

    this._broadcasters[name].observable = new Observable(subscriberPackage.subscriberFn);
    this._broadcasters[name].info = subscriberPackage.info;

    //Wrap the event emitter so, the messaging can be further customized
    this._broadcasters[name].broadcasterObject =  {

      emit: (data) => subscriberPackage.event.emit(data),
      error: (error) => subscriberPackage.event.error(error),
      complete: () => subscriberPackage.event.complete()
    }


    //Add all the waiting receivers
    if (this._waitingReceivers[name])
      this._waitingReceivers[name].forEach((waitingReceiver) => {
        let unsubscriberObj = this.receiveFrom(name, waitingReceiver.name, waitingReceiver.callback);

        waitingReceiver.subscriptionResolver(unsubscriberObj);  //Resolve the prmose with
      })

    return this._broadcasters[name].broadcasterObject;
  }

  public receiveFrom(broadcasterName: string, receiverName: string, callback: any): Promise<any> | any {

    if (typeof receiverName !== 'string')
      throw "Invalid receiver name";

    //Put in the waiting list if the named broadcaster is absent
    if (!this._broadcasters[broadcasterName]){

      let subscriptionResolver;
      
      //Promise to return to the user. This will be resolved with the unsubscriber object soon as the Broadcaster appears
      let subscriptionPromise = new Promise((resolve) => {
        subscriptionResolver = resolve;
      });


      if (!this._waitingReceivers[broadcasterName])
        this._waitingReceivers[broadcasterName] = [];

      this._waitingReceivers[broadcasterName].push({
        name: receiverName,
        callback,
        subscriptionResolver
      })

      return subscriptionPromise;
      
    } 
    else
      var connector = this._broadcasters[broadcasterName];


    this.currentReceiverName = receiverName;

    var subscription = connector.observable.subscribe({
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

  public info() {

    let ret = {};

    for (let [key, value] of Object.entries(this._broadcasters))
      ret[key] = value.info()

    return ret;
 
  }

  //Notifier --------
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


  //Listener-----
  public createListener(name: string, callback: any) {
    
    let event: EventEmitter<any>;

    //Retreive the event and replace the subscription for existing listeners
    if (this._listeners[name]){

      this._listeners[name].subscription.unsubscribe();
      event = this._listeners[name].event;  
    }
    else
      event = new EventEmitter();



    let classContext = this;

    let subscription = event.subscribe({

      next(data){ 
        callback(data.connectionName, data.data, null, null); 
      },

      error(error) {
        callback(error.connectionName, null, error.error, null);
      },

      complete() {
        callback(classContext.currentConnectionName , null, null, true);
        delete classContext._listeners[name];
      }

    })


    //Add the listener
    this._listeners[name] = {event, subscription}


    //Add all the waiting 
    if (this._waitingConnections[name])
      this._waitingConnections[name].forEach((connection) => {
        
        //Obtain the messageStremObject
        let messageStream = this.connectToListener(name, connection.name);

        //Resolve the promises with that
        connection.messageStreamResolver(messageStream);
      })

 
  }

  public connectToListener(listenerName: string, connectionName:string): IMessageStream | Promise<IMessageStream>{

    if (typeof connectionName !== 'string')
      throw 'Invalid connection name';

    //Put in the waiting connections list
    if (!this._listeners[listenerName]){

      let messageStreamResolver;
      
      //Promise to return to the user. This will be resolved with the unsubscriber object soon as the Broadcaster appears
      let messageStreamPromise = new Promise<IMessageStream>((resolve) => {
        messageStreamResolver = resolve;
      });


      if (!this._waitingConnections[listenerName])
        this._waitingConnections[listenerName] = [];

      this._waitingConnections[listenerName].push({
        name: listenerName,
        messageStreamResolver
      })

      return messageStreamPromise;

    }
    

    let event: EventEmitter<any> = this._listeners[listenerName].event;
    
    let classContext = this;

    return {

      emit(data) {
        event.emit({connectionName, data})
      },

      error(error) {
        event.error({connectionName, error})
      },

      complete() {

        classContext.currentConnectionName = connectionName;
        event.complete()
        
      }
    }

  }



  //--------------------------- Helpers -------------------------//


  //Broadcaster helpers
  private subscriberFactory(observerName: string) {

    //Factory to return a subscriber function with multicast support

    //All observers are saved here
    const observers: IObserverClient[] = [];

    const event: EventEmitter<any> = new EventEmitter();

    const classContext = this;

    let eventSubscribed: boolean = false; //To indicate the first subscriber has arrived and the event is subscribed


    const subscriberFn = function (observer) {

      //If this is the same client, remove the old observer
      for (let [i, observableClient] of observers.entries()) {
        if (observableClient.clientName === classContext.currentReceiverName){
          observers.splice(i, 1);
        }
      }

      observers.push({
        observer,
        clientName: classContext.currentReceiverName
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

            classContext._broadcasters[observerName].observable = null;
            delete classContext._broadcasters[observerName];
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
