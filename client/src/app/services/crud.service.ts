import { Injectable } from '@angular/core';
import { Subject } from 'rxjs/Subject';
import { Observable } from 'rxjs/Observable';
import * as io from 'socket.io-client';

@Injectable()
export class CrudService {
  private url = 'http://localhost:3000';
  private socket;

  sendChange(infoChange){
    this.socket.emit('event-change', infoChange);
  }

  constructor() { }

  getChange() : any {
    let observable = new Observable(observer => {
      this.socket = io(this.url);
      this.socket.on('update-change', (data) => {
        observer.next(data);
      });
      return () => {
        this.socket.disconnect();
      };
    })
    return observable;
  }

}
