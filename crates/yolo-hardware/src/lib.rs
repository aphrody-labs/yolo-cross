use serde::{Deserialize, Serialize};

#[derive(Debug, thiserror::Error)]
pub enum HardwareSpecError {
    #[error("JSON deserialization error: {0}")]
    Json(#[from] serde_json::Error),
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WebGpuSpec {
    pub version: String,
    #[serde(rename = "specUrl")]
    pub spec_url: String,
    pub features: Vec<String>,
    pub limits: std::collections::HashMap<String, u64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LinuxKernelSpec {
    #[serde(rename = "kernelVersion")]
    pub kernel_version: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CpuIsaSpec {
    pub architecture: String,
    pub vendor: String,
    pub family: String,
    #[serde(rename = "modelName")]
    pub model_name: String,
    #[serde(rename = "microarchitectureLevel")]
    pub microarchitecture_level: String,
    pub features: serde_json::Value,
    pub registers: serde_json::Value,
    #[serde(rename = "cacheTopology")]
    pub cache_topology: serde_json::Value,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HypervisorSpec {
    #[serde(rename = "hypervisorBackend")]
    pub hypervisor_backend: String,
    pub accelerator: serde_json::Value,
    #[serde(rename = "vcpuTopology")]
    pub vcpu_topology: serde_json::Value,
    #[serde(rename = "memoryConfig")]
    pub memory_config: serde_json::Value,
    #[serde(rename = "virtioDevices")]
    pub virtio_devices: Vec<serde_json::Value>,
}

pub fn parse_webgpu_spec(json: &str) -> Result<WebGpuSpec, HardwareSpecError> {
    Ok(serde_json::from_str(json)?)
}

pub fn parse_linux_kernel_spec(json: &str) -> Result<LinuxKernelSpec, HardwareSpecError> {
    Ok(serde_json::from_str(json)?)
}

pub fn parse_cpu_isa_spec(json: &str) -> Result<CpuIsaSpec, HardwareSpecError> {
    Ok(serde_json::from_str(json)?)
}

pub fn parse_hypervisor_spec(json: &str) -> Result<HypervisorSpec, HardwareSpecError> {
    Ok(serde_json::from_str(json)?)
}

/// Map a catalogued CPU ISA profile to an explicit Rust `target-cpu` value.
/// This is opt-in: host hardware never silently determines a portable binary's baseline.
pub fn rustc_target_cpu_profile(target_triple: &str, profile: &str) -> Option<&'static str> {
    if !target_triple.starts_with("x86_64-") {
        return None;
    }
    match profile {
        "x86-64-v1" => Some("x86-64"),
        "x86-64-v2" => Some("x86-64-v2"),
        "x86-64-v3" => Some("x86-64-v3"),
        "x86-64-v4" => Some("x86-64-v4"),
        _ => None,
    }
}
