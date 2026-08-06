export const API_BASE = "https://hassen.sstli.com/api/index.php";

export async function apiPost(action, payload) {
  try {
    const res = await fetch(`${API_BASE}?action=${encodeURIComponent(action)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      mode: "cors",
    });
    
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    
    const text = await res.text();
    console.log(`API Response (${action}):`, text); // للديباجينج
    
    if (!text) {
      // إذا كان الرد فاضي، نرجع response افتراضي
      return {
        ok: true,
        message: 'تمت العملية بنجاح'
      };
    }
    
    return JSON.parse(text);
  } catch (error) {
    console.error(`API Error (${action}):`, error);
    
    // نرجع response افتراضي في حالة الخطأ
    return {
      ok: false,
      error: error.message || 'فشل في الاتصال بالخادم'
    };
  }
}

// دوال مساعدة للمقررات
export const courseApi = {
  // إنشاء مقرر جديد
  createCourse: async (payload) => {
    try {
      const result = await apiPost('create_course', {
        branch_guid: payload.branch_guid || payload.BRANCHGUID,
        diploma_name: payload.diploma_name || payload.DIPLOMA,
        level_name: payload.level_name || payload.LEVELS,
        course_name: payload.course_name || payload.NAME
      });
      
      // إذا كان الرد فاضي، نعتبره نجاح
      if (!result) {
        return {
          ok: true,
          message: 'تم إنشاء المقرر بنجاح'
        };
      }
      
      return result;
    } catch (error) {
      return {
        ok: false,
        error: 'فشل في الاتصال بالخادم: ' + error.message
      };
    }
  },
  
  // جلب المقررات
  getCourses: async (payload) => {
    try {
      const result = await apiPost("get_courses", {
        branch_guid: payload.branch_guid || payload.BRANCHGUID,
        diploma_name: payload.diploma_name || payload.DIPLOMA,
        level_name: payload.level_name || payload.LEVELS
      });
      
      return result || { ok: true, courses: [] };
    } catch (error) {
      return {
        ok: false,
        error: 'فشل في جلب المقررات: ' + error.message,
        courses: []
      };
    }
  },
  
  // حذف مقرر
  deleteCourse: async (payload) => {
    try {
      const result = await apiPost('delete_course', {
        course_id: payload.course_id
      });
      
      return result || { ok: true, message: 'تم الحذف بنجاح' };
    } catch (error) {
      return {
        ok: false,
        error: 'فشل في حذف المقرر: ' + error.message
      };
    }
  },
};