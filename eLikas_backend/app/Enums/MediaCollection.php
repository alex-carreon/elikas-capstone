<?php
namespace App\Enums;

enum MediaCollection: string
{
    case FloodReports = 'uploads/hazard-reports';
    case Comments = 'uploads/comments';
    case EvacAreas = 'uploads/evacuation-centers';
}
