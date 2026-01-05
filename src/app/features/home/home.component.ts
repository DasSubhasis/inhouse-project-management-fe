import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent {
  stats = [
    {
      title: 'Total Calls',
      value: '1,234',
      change: '+12.5%',
      isPositive: true,
      icon: 'phone'
    },
    {
      title: 'Answered Calls',
      value: '987',
      change: '+8.3%',
      isPositive: true,
      icon: 'check'
    },
    {
      title: 'Missed Calls',
      value: '247',
      change: '-5.2%',
      isPositive: false,
      icon: 'x'
    },
    {
      title: 'Avg Duration',
      value: '4m 32s',
      change: '+2.1%',
      isPositive: true,
      icon: 'clock'
    }
  ];

  recentCalls = [
    { name: 'John Doe', phone: '+1 234 567 8900', time: '2 mins ago', type: 'incoming', duration: '3m 45s' },
    { name: 'Jane Smith', phone: '+1 234 567 8901', time: '15 mins ago', type: 'outgoing', duration: '5m 12s' },
    { name: 'Bob Johnson', phone: '+1 234 567 8902', time: '1 hour ago', type: 'missed', duration: '-' },
    { name: 'Alice Williams', phone: '+1 234 567 8903', time: '2 hours ago', type: 'incoming', duration: '2m 30s' },
    { name: 'Charlie Brown', phone: '+1 234 567 8904', time: '3 hours ago', type: 'outgoing', duration: '7m 20s' }
  ];
}
