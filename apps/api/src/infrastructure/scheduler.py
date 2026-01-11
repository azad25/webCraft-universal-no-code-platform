"""
Scheduler Service for WebCraft Platform
Handles scheduled automation execution
"""

import asyncio
from datetime import datetime, timedelta
from typing import Dict, Any, Optional, List
import logging

logger = logging.getLogger(__name__)

# In-memory job storage
scheduled_jobs: Dict[str, Dict[str, Any]] = {}


class SchedulerService:
    """Service for managing scheduled automations"""
    
    _instance = None
    _running = False
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance
    
    async def start(self):
        """Start the scheduler"""
        if not self._running:
            self._running = True
            logger.info("Scheduler started")
    
    async def stop(self):
        """Stop the scheduler"""
        if self._running:
            self._running = False
            logger.info("Scheduler stopped")
    
    async def schedule_automation(self, automation_id: str, trigger_config: Dict[str, Any]) -> bool:
        """Schedule an automation based on its trigger config"""
        job_id = f"automation_{automation_id}"
        
        schedule_type = trigger_config.get("schedule_type", "cron")
        
        job_data = {
            "id": job_id,
            "automation_id": automation_id,
            "schedule_type": schedule_type,
            "trigger_config": trigger_config,
            "next_run_time": self._calculate_next_run(trigger_config),
            "created_at": datetime.utcnow().isoformat()
        }
        
        scheduled_jobs[job_id] = job_data
        logger.info(f"Scheduled automation {automation_id}")
        return True
    
    async def unschedule_automation(self, automation_id: str) -> bool:
        """Remove an automation from the schedule"""
        job_id = f"automation_{automation_id}"
        if job_id in scheduled_jobs:
            del scheduled_jobs[job_id]
            logger.info(f"Unscheduled automation {automation_id}")
            return True
        return False
    
    def _calculate_next_run(self, trigger_config: Dict[str, Any]) -> Optional[str]:
        """Calculate next run time based on trigger config"""
        schedule_type = trigger_config.get("schedule_type", "cron")
        
        if schedule_type == "interval":
            interval_value = trigger_config.get("interval_value", 1)
            interval_unit = trigger_config.get("interval_unit", "hours")
            
            if interval_unit == "minutes":
                next_run = datetime.utcnow() + timedelta(minutes=interval_value)
            elif interval_unit == "hours":
                next_run = datetime.utcnow() + timedelta(hours=interval_value)
            elif interval_unit == "days":
                next_run = datetime.utcnow() + timedelta(days=interval_value)
            else:
                next_run = datetime.utcnow() + timedelta(hours=1)
            
            return next_run.isoformat()
        
        elif schedule_type == "once":
            return trigger_config.get("run_at")
        
        # For cron, return next hour as placeholder
        return (datetime.utcnow() + timedelta(hours=1)).isoformat()
    
    def get_scheduled_jobs(self) -> List[Dict[str, Any]]:
        """Get all scheduled jobs"""
        return list(scheduled_jobs.values())
    
    def get_job_info(self, automation_id: str) -> Optional[Dict[str, Any]]:
        """Get info about a specific scheduled job"""
        job_id = f"automation_{automation_id}"
        return scheduled_jobs.get(job_id)
    
    async def trigger_now(self, automation_id: str) -> bool:
        """Trigger an automation immediately"""
        job_id = f"automation_{automation_id}"
        job = scheduled_jobs.get(job_id)
        
        if job:
            job["next_run_time"] = datetime.utcnow().isoformat()
            return True
        return False


# Global scheduler instance
scheduler_service = SchedulerService()


async def init_scheduler():
    """Initialize and start the scheduler"""
    await scheduler_service.start()


async def shutdown_scheduler():
    """Shutdown the scheduler"""
    await scheduler_service.stop()
