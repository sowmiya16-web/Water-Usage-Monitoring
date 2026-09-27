package com.watermonitoring.dto.building;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
public class BuildingDto {

    private Integer buildingId;
    @NotBlank(message = "Building name is required")
    private String buildingName;
    @NotNull(message = "Total floors is required")
    private Integer totalFloors;
    @NotNull(message = "Total units is required")
    private Integer totalUnits;
    public BuildingDto() {}
    public BuildingDto(Integer buildingId, String buildingName, Integer totalFloors, Integer totalUnits) {
        this.buildingId = buildingId;
        this.buildingName = buildingName;
        this.totalFloors = totalFloors;
        this.totalUnits = totalUnits;
    }
    public Integer getBuildingId() { return buildingId; }
    public void setBuildingId(Integer buildingId) { this.buildingId = buildingId; }
    public String getBuildingName() { return buildingName; }
    public void setBuildingName(String buildingName) { this.buildingName = buildingName; }
    public Integer getTotalFloors() { return totalFloors; }
    public void setTotalFloors(Integer totalFloors) { this.totalFloors = totalFloors; }
    public Integer getTotalUnits() { return totalUnits; }
    public void setTotalUnits(Integer totalUnits) { this.totalUnits = totalUnits; }
}
