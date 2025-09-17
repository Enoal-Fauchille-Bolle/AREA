import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';
import { Injectable } from '@nestjs/common';

@WebSocketGateway({ cors: true })
@Injectable()
export class MinuteGateway {
  @WebSocketServer()
  server: Server;

  private timer: NodeJS.Timeout | null = null;
  private lastMinute: number | null = null;

  afterInit() {
    this.startMinuteEmitter();
  }

  handleConnection() {
    if (!this.timer) {
      this.startMinuteEmitter();
    }
  }

  private startMinuteEmitter() {
    this.timer = setInterval(() => {
      const now = new Date();
      const minute = now.getMinutes();
      if (minute !== this.lastMinute) {
        this.lastMinute = minute;
        this.server.emit('minute', minute);
      }
    }, 1000);
  }
}
