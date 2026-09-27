package com.watermonitoring.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "building")
public class Building {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "building_id")
    private Integer buildingId;

    @Column(name = "building_name", nullable = false, length = 100)
    private String buildingName;

    @Column(name = "total_floors", nullable = false)
    private Integer totalFloors;

    @Column(name = "total_units", nullable = false)
    private Integer totalUnits;

    public Building() {}

    public Building(String buildingName, Integer totalFloors, Integer totalUnits) {
        this.buildingName = buildingName;
        this.totalFloors = totalFloors;
        this.totalUnits = totalUnits;
    }

    public Integer getBuildingId() {
        return buildingId;
    }

    public void setBuildingId(Integer buildingId) {
        this.buildingId = buildingId;
    }

    public String getBuildingName() {
        return buildingName;
    }

    public void setBuildingName(String buildingName) {
        this.buildingName = buildingName;
    }

    public Integer getTotalFloors() {
        return totalFloors;
    }

    public void setTotalFloors(Integer totalFloors) {
        this.totalFloors = totalFloors;
    }

    public Integer getTotalUnits() {
        return totalUnits;
    }

    public void setTotalUnits(Integer totalUnits) {
        this.totalUnits = totalUnits;
    }
}
