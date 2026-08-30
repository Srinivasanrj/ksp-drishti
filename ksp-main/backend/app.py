"""
Karnataka State Police - Sentinel AI Command Platform
Flask Application Entry Point

Main server setup, route blueprints, static file serving, and error handling.
"""

import logging
import os
from flask import Flask, jsonify, render_template
from routes import chat_bp
from config import Config


def create_app():
    """
    Application factory initializing Flask server, application logging,
    and blueprint route registrations.
    """
    # 1. Initialize logging system
    log_directory = Config.BASE_DIR / 'logs'
    log_directory.mkdir(exist_ok=True)
    
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s [%(levelname)s] %(name)s: %(message)s',
        handlers=[
            logging.FileHandler(log_directory / 'application.log'),
            logging.StreamHandler()
        ]
    )
    
    logger = logging.getLogger("KSP_Sentinel_App")
    logger.info("Initializing KSP Sentinel Command AI Server...")

    # 2. Configure static distribution path for compiled React frontend
    frontend_dist_path = os.path.abspath(
        os.path.join(os.path.dirname(__file__), '..', 'frontend', 'dist')
    )

    app = Flask(
        __name__,
        template_folder=frontend_dist_path,
        static_folder=frontend_dist_path,
        static_url_path=''
    )
    app.config.from_object(Config)

    # 3. Register route blueprints
    app.register_blueprint(chat_bp)

    # 4. Root web landing route serving SPA Single Page Application
    @app.route('/', methods=['GET'])
    def home():
        return render_template('index.html')

    # 5. Global Exception Handlers
    @app.errorhandler(404)
    def handle_not_found(error):
        return jsonify({
            "success": False,
            "error": "Requested resource endpoint was not found on KSP Sentinel server."
        }), 404
        
    @app.errorhandler(500)
    def handle_internal_error(error):
        return jsonify({
            "success": False,
            "error": "An internal server error occurred while processing the request."
        }), 500

    return app


if __name__ == '__main__':
    # Launch development command server on port 5000
    server_app = create_app()
    server_app.run(host='0.0.0.0', port=5000, debug=False, use_reloader=False)
