#!/usr/bin/env bash
# Place in .platform/hooks/postdeploy directory
sudo certbot -n -d turtleshelterprojectintex4-6.us-east-1.elasticbeanstalk.com --nginx --agree-tos --email bgurr13@byu.edu
sudo certbot -n -d turtleshelter46.is404.net --nginx --agree-tos --email bgurr13@byu.edu
