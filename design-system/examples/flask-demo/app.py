#!/usr/bin/env python3
"""
Flask Demo Application for TicketIQ Design System
This demo shows how to integrate the design system with a Flask application.
"""

from flask import Flask, render_template, request, flash, redirect, url_for
import os

app = Flask(__name__)
app.secret_key = 'demo-secret-key-change-in-production'

# Sample data for demonstration
SAMPLE_TICKETS = [
    {
        'id': 1001,
        'subject': 'Login issue with mobile app',
        'status': 'open',
        'priority': 'high',
        'created': '2 hours ago',
        'description': 'Users are unable to log in using the mobile application. The error occurs after entering credentials.'
    },
    {
        'id': 1002,
        'subject': 'Payment processing error',
        'status': 'in_progress',
        'priority': 'critical',
        'created': '4 hours ago',
        'description': 'Payment gateway is returning errors for credit card transactions.'
    },
    {
        'id': 1003,
        'subject': 'Feature request: Dark mode',
        'status': 'resolved',
        'priority': 'low',
        'created': '1 day ago',
        'description': 'Users have requested a dark mode option for the application interface.'
    },
    {
        'id': 1004,
        'subject': 'Database connection timeout',
        'status': 'open',
        'priority': 'high',
        'created': '2 days ago',
        'description': 'Application is experiencing intermittent database connection timeouts during peak hours.'
    }
]

DEPARTMENTS = [
    {'value': 'engineering', 'label': 'Engineering'},
    {'value': 'marketing', 'label': 'Marketing'},
    {'value': 'sales', 'label': 'Sales'},
    {'value': 'support', 'label': 'Customer Support'},
    {'value': 'hr', 'label': 'Human Resources'}
]

@app.route('/')
def dashboard():
    """Dashboard page showing ticket statistics and recent activity."""
    stats = {
        'total': len(SAMPLE_TICKETS),
        'resolved': len([t for t in SAMPLE_TICKETS if t['status'] == 'resolved']),
        'in_progress': len([t for t in SAMPLE_TICKETS if t['status'] == 'in_progress']),
        'open': len([t for t in SAMPLE_TICKETS if t['status'] == 'open'])
    }
    
    return render_template('dashboard.html', 
                         tickets=SAMPLE_TICKETS, 
                         stats=stats)

@app.route('/tickets')
def tickets():
    """Tickets listing page."""
    return render_template('tickets.html', tickets=SAMPLE_TICKETS)

@app.route('/tickets/<int:ticket_id>')
def ticket_detail(ticket_id):
    """Individual ticket detail page."""
    ticket = next((t for t in SAMPLE_TICKETS if t['id'] == ticket_id), None)
    if not ticket:
        flash('Ticket not found', 'danger')
        return redirect(url_for('tickets'))
    
    return render_template('ticket_detail.html', ticket=ticket)

@app.route('/tickets/new', methods=['GET', 'POST'])
def new_ticket():
    """Create new ticket form."""
    if request.method == 'POST':
        # In a real application, you would save to database
        subject = request.form.get('subject')
        description = request.form.get('description')
        priority = request.form.get('priority')
        department = request.form.get('department')
        
        if subject and description:
            flash(f'Ticket "{subject}" created successfully!', 'success')
            return redirect(url_for('tickets'))
        else:
            flash('Please fill in all required fields', 'danger')
    
    return render_template('new_ticket.html', departments=DEPARTMENTS)

@app.route('/form-demo')
def form_demo():
    """Form components demonstration page."""
    return render_template('form_demo.html', departments=DEPARTMENTS)

@app.route('/components')
def components():
    """Design system components showcase."""
    return render_template('components.html')

@app.route('/settings')
def settings():
    """Application settings page."""
    return render_template('settings.html')

@app.errorhandler(404)
def not_found(error):
    """404 error handler."""
    return render_template('404.html'), 404

@app.errorhandler(500)
def server_error(error):
    """500 error handler."""
    return render_template('500.html'), 500

if __name__ == '__main__':
    # Enable debug mode for development
    app.run(debug=True, host='0.0.0.0', port=5000)